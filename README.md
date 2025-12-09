# InboxIQ - AI-Powered Email Management

InboxIQ is a beginner-friendly email management application that uses AI to help you manage your Gmail inbox. Ask questions about your emails, get AI-powered insights, and let the AI draft replies for you!

## 🌟 Features

- **Email Management**: View, search, and manage your Gmail emails
- **AI Assistant**: Ask questions about your emails using natural language
- **Smart Search**: Find emails using AI-powered semantic search
- **AI-Drafted Replies**: Let AI draft email responses for you to review
- **Pending Actions**: Review and approve AI-suggested actions before they execute

## 📋 Prerequisites

Before you begin, make sure you have these installed:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
3. **Ollama** (for AI features) - [Download here](https://ollama.ai/)

### Setting up Ollama

After installing Ollama, you need to download the AI models:

```bash
# Download the chat model (for answering questions)
ollama pull qwen2.5:1.5b

# Download the embeddings model (for semantic search)
ollama pull all-mpnet-base-v2
```

Make sure Ollama is running on `http://localhost:11434` (it runs automatically after installation).

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd /Users/jivitrana/Desktop/InboxIQ
```

### 2. Set Up the Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create a .env file with your configuration
# See "Environment Variables" section below

# Start the backend server
node server.js
```

The backend will start on `http://localhost:3000`

### 3. Set Up the Frontend

Open a new terminal window:

```bash
# Navigate to frontend folder
cd /Users/jivitrana/Desktop/InboxIQ/frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will open in your browser at `http://localhost:5173`

## 🔐 Environment Variables

Create a `.env` file in the `backend` folder with these variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/inboxiq

# JWT Secret (for authentication)
# Generate a random string for this
JWT_SECRET=your-super-secret-jwt-key-change-this

# Pinecone (for AI vector search)
# Sign up at https://www.pinecone.io/ to get these
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=inboxiq

# Google OAuth (for Gmail connection) - OPTIONAL
# These are needed to connect Gmail accounts
# Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Getting Pinecone Credentials

1. Go to [pinecone.io](https://www.pinecone.io/) and create a free account
2. Create a new index called `inboxiq`
3. Copy your API key from the dashboard
4. Add both to your `.env` file

## 📁 Project Structure

```
InboxIQ/
├── backend/                 # Backend server (Node.js + Express)
│   ├── models/             # Database models (User, Email, PendingAction)
│   ├── routes/             # API routes (auth, emails, chat, sync)
│   ├── services/           # Business logic (Gmail, AI)
│   ├── middleware/         # Authentication middleware
│   ├── config/             # Database configuration
│   └── server.js           # Main server file
│
├── frontend/               # Frontend app (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Auth/      # Login & Register
│   │   │   ├── Dashboard/ # Main dashboard
│   │   │   ├── Email/     # Email list & viewer
│   │   │   ├── Actions/   # Pending actions
│   │   │   └── ui/        # Reusable UI components
│   │   ├── services/      # API client
│   │   ├── context/       # React context (auth)
│   │   └── App.jsx        # Main app component
│   └── package.json
│
└── README.md              # This file!
```

## 🎯 How to Use

### 1. Register an Account

- Open the app in your browser
- Click "Sign up" and create an account
- You'll be automatically logged in

### 2. View Your Emails

- Click on "Emails" in the sidebar
- You'll see a list of your emails (if any are synced)
- Click on an email to view its full content

### 3. Sync Gmail (Coming Soon)

The Gmail connection feature is currently being set up. Once ready, you'll be able to:
- Click "Connections" in the sidebar
- Connect your Gmail account
- Sync your emails automatically

### 4. Use AI Features

Once you have emails synced:
- Ask questions like "Do I have any unread emails?"
- Search for specific emails
- Let AI draft replies for you

## 🛠️ Troubleshooting

### Backend won't start

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**: Make sure MongoDB is running:
```bash
# On Mac with Homebrew:
brew services start mongodb-community

# Or start manually:
mongod
```

### AI features not working

**Problem**: `Error: ECONNREFUSED localhost:11434`

**Solution**: Make sure Ollama is running:
```bash
# Check if Ollama is running
ollama list

# If not, start it (it usually starts automatically)
```

### Frontend can't connect to backend

**Problem**: Network errors in browser console

**Solution**: 
1. Make sure backend is running on port 3000
2. Check that `API_BASE_URL` in `frontend/src/services/api.js` is `http://localhost:3000/api`

### "No emails found"

This is normal if you haven't connected Gmail yet. The Gmail connection feature is being set up.

## 🔄 Development Workflow

### Making Changes

1. **Backend changes**: Edit files in `backend/`, server auto-restarts with nodemon
2. **Frontend changes**: Edit files in `frontend/src/`, page auto-refreshes

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`, logic in `backend/services/`
2. **Frontend**: Add components in `frontend/src/components/`, API calls in `frontend/src/services/api.js`

## 📚 Learn More

### Technologies Used

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite, TailwindCSS
- **AI**: Ollama (LangChain), Pinecone (vector database)
- **Authentication**: JWT (JSON Web Tokens)

### Helpful Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ollama Documentation](https://ollama.ai/docs)

## 🤝 Contributing

This is a beginner-friendly project! Feel free to:
- Ask questions
- Report bugs
- Suggest features
- Submit improvements

## 📝 License

MIT License - feel free to use this project for learning!

---

**Need help?** Check the troubleshooting section above or open an issue!
