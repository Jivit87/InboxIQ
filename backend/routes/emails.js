const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
  searchEmails, 
  getEmailById, 
  getUnreadEmails,
  sendEmail 
} = require('../services/gmailService');
const Email = require('../models/Email');


// Get all emails that to user paginated
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const emails = await Email.find({ userId: req.userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-body -embeddings')
      .lean();

    const total = await Email.countDocuments({ userId: req.userId });

    res.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get emails',
      details: error.message,
    });
  }
});

// Search emails 
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const query = req.params.query;
    const limit = parseInt(req.query.limit) || 20;

    const emails = await searchEmails(req.userId, query, limit);

    res.json({
      query,
      count: emails.length,
      emails,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Email search failed',
      details: error.message,
    });
  }
});

// Get unread emails
router.get('/filter/unread', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const emails = await getUnreadEmails(req.userId, limit);

    res.json({
      count: emails.length,
      emails,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get unread emails',
      details: error.message,
    });
  }
});

// Get emails from specific sender
router.get('/from/:email', authMiddleware, async (req, res) => {
  try {
    const senderEmail = req.params.email;
    const limit = parseInt(req.query.limit) || 20;

    const emails = await Email.find({
      userId: req.userId,
      'from.email': senderEmail,
    })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    res.json({
      sender: senderEmail,
      count: emails.length,
      emails,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get emails from sender',
      details: error.message,
    });
  }
});

// Send email
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { to, cc, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'To, subject, and body are required',
      });
    }

    const result = await sendEmail(req.userId, { to, cc, subject, body });

    res.json({
      message: 'Email sent successfully',
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
    });
  }
});


// Update
// Toggle Read Status
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { isRead } = req.body;
    
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: isRead },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});


router.put('/:id/star', authMiddleware, async (req, res) => {
  try {
    const { isStarred } = req.body;
    
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isStarred: isStarred },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});


// Delete
// Delete single email
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const email = await Email.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ message: 'Email deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

router.delete('/all/reset', authMiddleware, async (req, res) => {
  try {
    await Email.deleteMany({ userId: req.userId });
    
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.userId, {
      'lastSync.gmail': null,
      'lastSync.outlook': null
    });

    res.json({ message: 'All emails deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete emails' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const email = await getEmailById(req.userId, req.params.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get email',
      details: error.message,
    });
  }
});

module.exports = router;
