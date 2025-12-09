const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, generateToken } = require("../middleware/auth");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ email, password, name });
    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    const isMatch = user && (await user.comparePassword(password));

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

// PROFILE
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get profile" });
  }
});

// GOOGLE OAUTH - Get authorization URL
router.get("/google/auth-url", authMiddleware, async (req, res) => {
  try {
    const { google } = require('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GOOGLE OAUTH - Exchange code for tokens
router.post("/google/connect", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const { google } = require('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to user
    const user = await User.findById(req.userId);
    user.tokens = user.tokens || {};
    user.tokens.google = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scope: tokens.scope ? tokens.scope.split(' ') : []
    };
    user.connectedPlatforms = user.connectedPlatforms || {};
    user.connectedPlatforms.gmail = true;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Google account connected successfully' 
    });
  } catch (error) {
    console.error('Google connect error:', error);
    res.status(500).json({ error: 'Failed to connect Google account', details: error.message });
  }
});

// DISCONNECT PLATFORM
router.post("/disconnect/:platform", authMiddleware, async (req, res) => {
  try {
    const { platform } = req.params;
    const user = await User.findById(req.userId);

    if (platform === 'google') {
      if (user.tokens && user.tokens.google) {
        user.tokens.google = undefined;
      }
      if (user.connectedPlatforms) {
        user.connectedPlatforms.gmail = false;
      }
    }

    await user.save();

    res.json({ 
      success: true, 
      message: `${platform} disconnected successfully` 
    });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

module.exports = router;