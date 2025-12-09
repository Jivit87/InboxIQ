const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db.js")

const authRoutes = require("./routes/auth.js");
const emailRoutes = require('./routes/emails');
const chatRoutes = require('./routes/chat');
const syncRoutes = require('./routes/sync');

const PORT = 3000;

const app = express();
connectDB();

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true, // For storing jwt in cookie
  })
);

app.get("/health", (req, res) => {
  res.send("Server working perfectly fine!!!");
});

// api routes
app.use("/api/auth", authRoutes)
app.use("/api/emails", emailRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/sync", syncRoutes)

app.listen(PORT, () => {
  console.log(`Server running on: ${PORT}`);
});
