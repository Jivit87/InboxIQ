const { ChatOllama } = require('@langchain/ollama');
const { OllamaEmbeddings } = require('@langchain/ollama');  // text to nub..
const { Pinecone } = require('@pinecone-database/pinecone');  
const { PineconeStore } = require('@langchain/pinecone');  
const { PromptTemplate } = require('@langchain/core/prompts');  
const { RunnableSequence } = require('@langchain/core/runnables');  
const { StringOutputParser } = require('@langchain/core/output_parsers'); 
const { Document } = require('@langchain/core/documents'); 
const mongoose = require('mongoose'); 
const Email = require('../models/Email');  

const llm = new ChatOllama({
  model: 'qwen2.5:1.5b', 
  baseUrl: 'http://localhost:11434',
  temperature: 0.8,  //(0 = boring, 1 = very creative)
  timeout: 15000,  // Wait max 15 seconds for response
  numPredict: 200,  // Maximum words in response
  requestOptions: {
    timeout: 15000
  }
});


// STEP 3: Set Up Embeddings (Search Engine)
const embeddings = new OllamaEmbeddings({
  model: 'all-mpnet-base-v2',  
  baseUrl: 'http://localhost:11434',
  timeout: 5000  
});

// STEP 4: Set Up Vector Database Connection
// This stores our emails in a way that makes them searchable by meaning
let vectorDatabase = null;  // Holds our connection
let isDatabaseReady = false;  // Have we connected yet?

// Connects to Pinecone (our smart search database)
async function connectToVectorDatabase() {
  // If we're already connected, just return it
  if (isDatabaseReady && vectorDatabase) {
    return vectorDatabase;
  }
  
  // Check if we have the keys we need
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
    throw new Error('Pinecone is not set up. Add API key and index name to .env file');
  }
  
  // Connect to Pinecone
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });
  
  // Get our specific index (like choosing which filing cabinet to use)
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);
  
  // Create the vector store connection
  vectorDatabase = new PineconeStore(embeddings, {
    pineconeIndex,
    maxConcurrency: 3,  // Process 3 things at once (don't overwhelm the system)
    namespace: 'inboxiq'  // Our app's section in the database
  });
  
  isDatabaseReady = true;
  console.log('Connected to vector database!');
  return vectorDatabase;
}


// STEP 5: Process Emails (Add to Search Database)
async function processUserEmails(userId, limit = 30) {
  try {
    console.log(`Looking for emails to process for user: ${userId}`);
    
    // STEP 5.1: Find emails that haven't been processed yet
    const unprocessedEmails = await Email.find({
      userId: userId,
      embeddingsGenerated: false  // Only get emails we haven't processed
    }).limit(limit);
    
    // If no emails to process, we're done!
    if (unprocessedEmails.length === 0) {
      console.log('No new emails to process');
      return { 
        processed: 0, 
        message: 'All emails are already processed!' 
      };
    }
    
    console.log(`Found ${unprocessedEmails.length} emails to process`);
    
    // STEP 5.2: Connect to our vector database
    const vectorStore = await connectToVectorDatabase();
    
    // STEP 5.3: Process emails in small groups (batches)
    const BATCH_SIZE = 10;  // Process 10 emails at a time
    let totalProcessed = 0;
    
    // Loop through emails in batches
    for (let i = 0; i < unprocessedEmails.length; i += BATCH_SIZE) {
      const batch = unprocessedEmails.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      
      // STEP 5.4: Convert emails to Documents (format the database likes)
      const documents = batch.map(email => {
        // Combine subject and snippet into searchable text
        const searchableText = `${email.subject || 'No Subject'}\n\n${email.snippet || ''}`;
        
        return new Document({
          pageContent: searchableText,  // The actual text to search
          metadata: {  // Extra info about this email
            userId: userId.toString(),
            platform: 'email',
            messageId: email.messageId,
            from: email.from.email,
            subject: email.subject,
            date: email.date.toISOString(),
            docId: email._id.toString()
          }
        });
      });
      
      // STEP 5.5: Add documents to vector database
      await vectorStore.addDocuments(documents);
      console.log(`Added ${documents.length} emails to search database`);
      
      // STEP 5.6: Mark these emails as processed in MongoDB
      const emailIds = batch.map(email => email._id);
      await Email.updateMany(
        { _id: { $in: emailIds } },
        { $set: { embeddingsGenerated: true, processed: true } }
      );
      
      totalProcessed += batch.length;
    }
    
    console.log(`Successfully processed ${totalProcessed} emails!`);
    return {
      processed: totalProcessed,
      total: unprocessedEmails.length,
      message: `Successfully processed ${totalProcessed} emails`
    };
    
  } catch (error) {
    console.error('Error processing emails:', error.message);
    throw new Error(`Failed to process emails: ${error.message}`);
  }
}

// STEP 6: Add Timeout Protection
// cancel if it takes more than usual time 
function addTimeout(operation, maxSeconds, errorMsg = 'Operation took too long') {
  const timeoutMs = maxSeconds * 1000;
  
  return Promise.race([
    operation,  // The actual operation
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
}

// STEP 7: Find Relevant Emails (Smart Search)

async function findRelevantEmails(userId, userQuestion) {
  try {
    console.log(`Searching for: "${userQuestion}"`);
    const questionLower = userQuestion.toLowerCase();
    
    // STEP 7.1: Quick search for common requests
    // Check if user is asking for unread emails
    const unreadKeywords = ['unread', 'new emails', 'latest emails', 'haven\'t read'];
    const isAskingForUnread = unreadKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    if (isAskingForUnread) {
      console.log('📬 Quick search: Finding unread emails...');
      const unreadEmails = await Email.find({ 
        userId, 
        read: false 
      })
        .sort({ date: -1 })  // Newest first
        .limit(3)
        .lean()  // Faster query
        .maxTimeMS(2000);  // Max 2 seconds
      
      return unreadEmails.map(email => ({
        type: 'email',
        from: email.from?.name || email.from?.email || 'Unknown',
        subject: email.subject || 'No subject',
        snippet: email.snippet || '',
        date: email.date,
        content: `${email.subject}\n${email.snippet || ''}`
      }));
    }
    
    // STEP 7.2: Use AI-powered semantic search for other questions
    try {
      console.log('Using AI search...');
      const vectorStore = await addTimeout(
        connectToVectorDatabase(), 
        3  // 3 seconds max to connect
      );
      
      // Search for similar emails
      const similarDocuments = await addTimeout(
        vectorStore.similaritySearch(userQuestion, 5, {
          filter: { userId: userId.toString() }
        }),
        5  // 5 seconds max for search
      );
      
      // If no results found, get recent emails instead
      if (similarDocuments.length === 0) {
        console.log('📭 No matches found, getting recent emails...');
        const recentEmails = await Email.find({ userId })
          .sort({ date: -1 })
          .limit(2)
          .lean()
          .maxTimeMS(2000);
        
        return recentEmails.map(email => ({
          type: 'email',
          from: email.from?.name || email.from?.email,
          subject: email.subject,
          snippet: email.snippet,
          date: email.date,
          content: `${email.subject}\n${email.snippet}`
        }));
      }
      
      // STEP 7.3: Get full email details from MongoDB
      const emailIds = similarDocuments
        .filter(doc => doc.metadata?.platform === 'email' && doc.metadata?.docId)
        .map(doc => new mongoose.Types.ObjectId(doc.metadata.docId))
        .slice(0, 3);  // Only top 3 results
      
      const fullEmails = await Email.find({ 
        _id: { $in: emailIds }, 
        userId 
      })
        .lean()
        .maxTimeMS(2000);
      
      console.log(`Found ${fullEmails.length} relevant emails`);
      return fullEmails.map(email => ({
        type: 'email',
        from: email.from?.name || email.from?.email,
        subject: email.subject,
        snippet: email.snippet,
        date: email.date,
        content: `${email.subject}\n${email.snippet}`
      }));
      
    } catch (error) {
      // If AI search fails, fall back to recent emails
      console.log('AI search failed, using fallback...');
      const recentEmails = await Email.find({ userId })
        .sort({ date: -1 })
        .limit(2)
        .lean()
        .maxTimeMS(2000);
      
      return recentEmails.map(email => ({
        type: 'email',
        from: email.from?.name || email.from?.email,
        subject: email.subject,
        snippet: email.snippet,
        date: email.date,
        content: `${email.subject}\n${email.snippet}`
      }));
    }
    
  } catch (error) {
    console.error('Error finding emails:', error.message);
    return [];  // Return empty array if everything fails
  }
}

// STEP 8: Ask AI a Question (Main Function!)
async function askAIQuestion(userId, userQuestion) {
  try {
    console.log(`User asked: "${userQuestion}"`);
    
    // STEP 8.1: Find relevant emails
    const relevantEmails = await addTimeout(
      findRelevantEmails(userId, userQuestion),
      6  // 6 seconds max
    );
    
    // STEP 8.2: Create a friendly prompt for the AI
    const promptTemplate = PromptTemplate.fromTemplate(
      `You are a helpful, friendly AI assistant helping Jivit to manage his emails.
Be casual, warm, and conversational - like a smart friend.

Here's what I found in their inbox:
{context}

They asked: {question}

Give a helpful, friendly response. Keep it casual and to the point. 
If you found relevant emails, mention them naturally (like "I saw an email from..." or "Looks like...").
If nothing's relevant, just say so in a friendly way.

Keep your response under 100 words unless more detail is needed.

Your response:`
    );
    
    // STEP 8.3: Format the emails into readable context
    const contextText = relevantEmails.length > 0
      ? relevantEmails
          .map((email, index) => {
            const date = new Date(email.date).toLocaleDateString();
            return `Email ${index + 1}: From ${email.from} on ${date}
   Subject: "${email.subject}"
   Preview: ${email.snippet.substring(0, 100)}...`;
          })
          .join('\n\n')
      : 'No relevant emails found in the inbox.';
    
    console.log('Asking AI to respond...');
    
    // STEP 8.4: Create AI chain and get response
    const aiChain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser()
    ]);
    
    const aiResponse = await addTimeout(
      aiChain.invoke({
        context: contextText,
        question: userQuestion
      }),
      15  // 15 seconds max for AI response
    );
    
    console.log('Got AI response!');
    return {
      answer: aiResponse.trim() || "I'm having trouble with that. Can you rephrase?",
      sources: relevantEmails,
      foundRelevantEmails: relevantEmails.length > 0
    };
    
    return {
      answer: aiResponse.trim() || "I'm having trouble with that. Can you rephrase?",
      sources: relevantEmails,
      foundRelevantEmails: relevantEmails.length > 0
    };
    
  } catch (error) {
    console.error('Error getting AI response:', error.message);
    
    // Return helpful error messages based on what went wrong
    if (error.message.includes('took too long') || error.message.includes('timeout')) {
      return {
        answer: "That's taking longer than expected. Can you try asking in a simpler way? 🤔",
        sources: [],
        foundRelevantEmails: false
      };
    }
    
    // Check for connection issues (Ollama down)
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return {
        answer: "I can't reach the AI service. Make sure Ollama is running on localhost:11434 🔧",
        sources: [],
        foundRelevantEmails: false
      };
    }
    
    return {
      answer: "Sorry, something went wrong. Want to try again? 😅",
      sources: [],
      foundRelevantEmails: false
    };
  }
}

// STEP 9: Quick Helper Functions

function checkIfUrgent(emailText) {
  const urgentWords = [
    'urgent', 
    'asap', 
    'important', 
    'critical', 
    'emergency', 
    'immediate'
  ];
  
  const textLower = emailText.toLowerCase();
  const isUrgent = urgentWords.some(word => textLower.includes(word));
  
  return isUrgent ? 'high' : 'medium';
}


// Analyze if an email is positive, negative, or neutral
function analyzeEmailSentiment(emailText) {
  const positiveWords = ['thank', 'thanks', 'great', 'excellent', 'love', 'happy', 'good'];
  const negativeWords = ['sorry', 'issue', 'problem', 'concern', 'unhappy', 'disappointed'];
  
  const textLower = emailText.toLowerCase();
  
  // Count positive and negative words
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Generate a reply to an email using AI
async function generateEmailReply(originalEmail, additionalContext) {
  try {
    // Create a prompt asking AI to write a reply
    const replyPrompt = `Write a friendly, professional email reply to this:

From: ${originalEmail.from.name || originalEmail.from.email}
Subject: ${originalEmail.subject}
Message: ${originalEmail.body.substring(0, 500)}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Write ONLY the email body. Keep it concise, warm, and professional.`;
    
    console.log('Generating email reply...');
    
    const aiReply = await addTimeout(
      llm.invoke(replyPrompt),
      12  // 12 seconds max
    );
    
    return {
      subject: `Re: ${originalEmail.subject}`,
      body: aiReply.content,
      to: [originalEmail.from.email]
    };
    
  } catch (error) {
    console.error('Failed to generate reply:', error.message);
    throw new Error(`Could not generate email reply: ${error.message}`);
  }
}

module.exports = {
  processUserEmails,        // Add emails to searchable database
  askAIQuestion,            // Ask AI about your emails (MAIN FUNCTION!)
  checkIfUrgent,           
  analyzeEmailSentiment,    // Check if email is positive/negative
  generateEmailReply        // Generate AI reply to email
};
