const { google } = require('googleapis');
const Email = require('../models/Email');
const User = require('../models/User');

// Get Gmail API Client
function getGmailClient(user) {
  // Checking if user has connected their Gmail account
  if (!user.tokens || !user.tokens.google) {
    throw new Error('Gmail not connected. Please connect your Gmail account first.');
  }

  // Create OAuth2 client with our app credentials
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set the user's access token
  oauth2Client.setCredentials({
    access_token: user.tokens.google.accessToken,
    refresh_token: user.tokens.google.refreshToken,
    expiry_date: user.tokens.google.expiresAt?.getTime()
  });

  // Create and return Gmail API client
  return google.gmail({ version: 'v1', auth: oauth2Client });
}


// FETCH EMAILS - Sync emails from Gmail to our database
async function fetchEmails(user, limit = 100) {
  try {
    
    // Get Gmail API client
    const gmail = getGmailClient(user);
    
    // STEP 1: Get list of message IDs from Gmail
    // We only get IDs first, then fetch full messages (more efficient)
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: limit,
      labelIds: ['INBOX']  // Only get inbox emails
    });

    const messages = listResponse.data.messages || [];
    
    if (messages.length === 0) {
      console.log('No messages found in Gmail');
      return { success: true, fetched: 0, message: 'No new emails' };
    }

    console.log(`Found ${messages.length} messages in Gmail`);
    
    // STEP 2: Fetch full details for each message
    let newEmailsCount = 0;
    
    for (const message of messages) {
      try {
        // Check if we already have this email
        const existingEmail = await Email.findOne({ messageId: message.id });
        if (existingEmail) {
          continue; // Skip if we already have it
        }

        // Fetch full message details from Gmail
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        // STEP 3: Extract email data from Gmail format
        const headers = fullMessage.data.payload.headers;
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        // Parse email addresses (can be in format "Name <email@example.com>")
        const parseEmail = (emailStr) => {
          if (!emailStr) return null;
          const match = emailStr.match(/<(.+)>/);
          return {
            email: match ? match[1] : emailStr,
            name: match ? emailStr.split('<')[0].trim() : ''
          };
        };

        // Get email body (can be in different formats)
        let body = '';
        if (fullMessage.data.payload.body.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString();
        } else if (fullMessage.data.payload.parts) {
          // Multi-part email, find the text part
          const textPart = fullMessage.data.payload.parts.find(part => part.mimeType === 'text/plain');
          if (textPart && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString();
          }
        }

        // STEP 4: Create email document for our database
        const emailData = {
          userId: user._id,
          messageId: message.id,
          threadId: fullMessage.data.threadId,
          from: parseEmail(getHeader('From')),
          to: getHeader('To').split(',').map(e => parseEmail(e.trim())).filter(e => e),
          cc: getHeader('Cc').split(',').map(e => parseEmail(e.trim())).filter(e => e),
          subject: getHeader('Subject'),
          body: body,
          snippet: fullMessage.data.snippet,
          date: new Date(parseInt(fullMessage.data.internalDate)),
          receivedAt: new Date(),
          labels: fullMessage.data.labelIds || [],
          isRead: !fullMessage.data.labelIds?.includes('UNREAD'),
          isStarred: fullMessage.data.labelIds?.includes('STARRED'),
          isImportant: fullMessage.data.labelIds?.includes('IMPORTANT'),
          hasAttachments: fullMessage.data.payload.parts?.some(part => part.filename) || false
        };

        // STEP 5: Save to database
        await Email.create(emailData);
        newEmailsCount++;
        
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error.message);
        // Continue with next message even if one fails
      }
    }

    console.log(`Successfully fetched ${newEmailsCount} new emails`);
    
    return {
      success: true,
      fetched: newEmailsCount,
      total: messages.length,
      message: `Fetched ${newEmailsCount} new emails`
    };

  } catch (error) {
    console.error(' Error fetching emails:', error.message);
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

// SEARCH EMAILS - Search in our database
async function searchEmails(userId, query, limit = 20) {
  try {
    // Use MongoDB text search to find matching emails
    const emails = await Email.find({
      userId: userId,
      $text: { $search: query }  // Full-text search
    })
      .sort({ date: -1 })  // Newest first
      .limit(limit)
      .select('-body -embeddings')  // Don't return full body (too large)
      .lean();  //Used for returning plain JavaScript objects (faster)

    return emails;
  } catch (error) {
    console.error('Search error:', error.message);
    throw new Error(`Email search failed: ${error.message}`);
  }
}

// GET EMAIL BY ID - Get single email details
async function getEmailById(userId, emailId) {
  try {
    const email = await Email.findOne({
      _id: emailId,
      userId: userId  // Make sure user owns this email
    }).lean();

    return email;
  } catch (error) {
    console.error('Get email error:', error.message);
    throw new Error(`Failed to get email: ${error.message}`);
  }
}

// GET UNREAD EMAILS - Get unread emails
async function getUnreadEmails(userId, limit = 50) {
  try {
    const emails = await Email.find({
      userId: userId,
      isRead: false
    })
      .sort({ date: -1 })  // Newest first
      .limit(limit)
      .select('-body -embeddings')
      .lean();

    return emails;
  } catch (error) {
    console.error('Get unread emails error:', error.message);
    throw new Error(`Failed to get unread emails: ${error.message}`);
  }
}

// SEND EMAIL - Send email via Gmail
async function sendEmail(user, emailData) {
  try {
    console.log(`Sending email to: ${emailData.to}`);
    
    // Get Gmail API client
    const gmail = getGmailClient(user);

    // STEP 1: Create email in RFC 2822 format (Gmail's required format)
    const toHeader = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
    const ccHeader = emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : '';
    
    let email = [
      `From: ${user.email}`,
      `To: ${toHeader}`,
      ccHeader ? `Cc: ${ccHeader}` : '',
      `Subject: ${emailData.subject}`,
      '',
      emailData.body
    ].filter(line => line).join('\n');

    // STEP 2: Encode email in base64url format
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // STEP 3: Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: emailData.replyToMessageId  // If replying, add to thread
      }
    });

    console.log(`Email sent successfully! ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('Send email error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  fetchEmails,       // Sync emails from Gmail to database
  searchEmails,      // Search emails in database
  getEmailById,      // Get single email by ID
  getUnreadEmails,   // Get unread emails
  sendEmail          // Send email via Gmail
};
