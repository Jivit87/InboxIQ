const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB is connected"))
    .catch((err) => console.log(err));
};

module.exports = connectDB;
