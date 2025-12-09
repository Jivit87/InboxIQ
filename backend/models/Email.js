// models/Email.js - Gmail message schema with embeddings
const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  // Reference to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Gmail-specific IDs
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  threadId: {
    type: String,
    index: true
  },
  
  // Email metadata
  from: {
    email: String,
    name: String
  },
  to: [{
    email: String,
    name: String
  }],
  cc: [{
    email: String,
    name: String
  }],
  bcc: [{
    email: String,
    name: String
  }],
  
  // Content
  subject: {
    type: String,
    index: 'text' // Enable text search
  },
  body: {
    type: String,
    index: 'text'
  },
  snippet: String, // Short preview
  
  // Timestamps
  date: {
    type: Date,
    index: true
  },
  receivedAt: Date,
  
  // Labels and flags
  labels: [String],
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isImportant: { type: Boolean, default: false },
  
  // Attachments
  hasAttachments: { type: Boolean, default: false },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String
  }],
  
  // Vector embeddings for semantic search
  embeddings: {
    type: [Number],
    select: false // Don't return by default (large array)
  },
  
  // Extracted entities (AI-powered)
  entities: {
    people: [String], // Names mentioned
    projects: [String], // Project names detected
    companies: [String], // Company names
    dates: [Date], // Important dates mentioned
    keywords: [String] // Key topics
  },
  
  // AI analysis
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'promotional', 'updates', 'other'],
    default: 'other'
  },
  
  // Processing status
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  processed: {
    type: Boolean,
    default: false
  },
  embeddingsGenerated: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient user queries
EmailSchema.index({ userId: 1, date: -1 });
EmailSchema.index({ userId: 1, processed: 1 });
EmailSchema.index({ userId: 1, 'from.email': 1 });

// Text index for full-text search
EmailSchema.index({ subject: 'text', body: 'text', 'from.name': 'text' });

module.exports = mongoose.model('Email', EmailSchema);