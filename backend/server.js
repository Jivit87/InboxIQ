const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db.js")

const authRoutes = require("./routes/auth.js");

const PORT = 3000;

const app = express();
connectDB();

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true, // for storing jwt in cookie
  })
);

app.get("/health", (req, res) => {
  res.send("Server working perfectly fine!!!");
});

// api routes
app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
  console.log(`Server running on: ${PORT}`);
});
