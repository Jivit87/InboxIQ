const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { fetchEmails, sendEmail } = require('../services/gmailService');
const { processUserEmails } = require('../services/aiService');
const User = require('../models/User');
const Email = require('../models/Email');

// Sync Gmail + process emails
router.post('/all', authMiddleware, async (req, res) => {
  try {
    const results = {
      gmail: { success: false },
      processing: { success: false }
    };
    
    // Sync Gmail
    if (req.user.connectedPlatforms.gmail) {
      try {
        const gmailResult = await fetchEmails(req.user, 100);
        results.gmail = gmailResult;

        // Update last sync time
        req.user.lastSync.gmail = new Date();
      } catch (error) {
        results.gmail = { success: false, error: error.message };
      }
    }

    // Save new sync times
    await req.user.save();

    // Process unprocessed emails -> create embeddings
    try {
      const processingResult = await processUserEmails(req.userId, 50);
      results.processing = processingResult;
    } catch (error) {
      results.processing = { success: false, error: error.message };
    }

    res.json({
      message: 'Sync completed',
      results,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Sync Gmail only
router.post('/gmail', authMiddleware, async (req, res) => {
  try {
    if (!req.user.connectedPlatforms.gmail) {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const result = await fetchEmails(req.user, limit);

    req.user.lastSync.gmail = new Date();
    await req.user.save();

    res.json(result);

  } catch (error) {
    console.error('Gmail sync error:', error);
    res.status(500).json({ error: 'Gmail sync failed', details: error.message });
  }
});

// Process unprocessed emails → embeddings
router.post('/process-emails', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await processUserEmails(req.userId, limit);

    res.json(result);

  } catch (error) {
    console.error('Process emails error:', error);
    res.status(500).json({ error: 'Email processing failed', details: error.message });
  }
});

// Get sync status (email only)
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const stats = {
      connectedPlatforms: user.connectedPlatforms,
      lastSync: user.lastSync,
      counts: {
        emails: await Email.countDocuments({ userId: req.userId }),
        emailsProcessed: await Email.countDocuments({
          userId: req.userId,
          embeddingsGenerated: true
        })
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status', details: error.message });
  }
});

module.exports = router;