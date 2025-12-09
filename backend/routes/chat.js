const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { askAIQuestion, generateEmailReply } = require('../services/aiService');
const { searchEmails, getUnreadEmails } = require('../services/gmailService');
const Email = require('../models/Email');

// query across all platforms
router.post('/query', authMiddleware, async (req, res) => {

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        error: 'Request timeout',
        message: 'The query took too long to process. Please try a simpler query.'
      });
    }
  }, 60000);
  
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Use RAG to query with context
    const result = await askAIQuestion(req.userId, message);
    
    clearTimeout(timeout);
    res.json({
      answer: result.answer,
      sources: result.sources,
      timestamp: new Date()
    });
    
  } catch (error) {
    clearTimeout(timeout);
    res.status(500).json({error: 'Failed to process query', details: error.message});
  }
});

// Searching for emails matching a query
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, limit } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const searchLimit = limit || 10;
    
    // Search emails only
    try {
      const emails = await searchEmails(req.userId, query, searchLimit);
      
      res.json({
        query: query,
        results: { emails },
        total: emails.length
      });
    } catch (error) {
      res.json({
        query: query,
        results: { emails: [] },
        total: 0
      });
    }
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

// Get unread emails summary
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const emails = await getUnreadEmails(req.userId, limit);
    
    res.json({
      count: emails.length,
      emails: emails.map(e => ({
        id: e._id,
        from: e.from,
        subject: e.subject,
        snippet: e.snippet,
        date: e.date
      }))
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get unread emails',
      details: error.message 
    });
  }
});

// Draft email response
router.post('/draft-email', authMiddleware, async (req, res) => {
  try {
    const { emailId, context } = req.body;
    
    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Get original email
    const email = await Email.findOne({
      userId: req.userId,
      _id: emailId
    });
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Generate draft
    const draft = await generateEmailReply(email, context);
    
    res.json({
      draft: draft,
      message: 'Draft created successfully.'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to draft email',
      details: error.message 
    });
  }
});



module.exports = router;