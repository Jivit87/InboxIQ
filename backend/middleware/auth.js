const jwt = require("jsonwebtoken");
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
    try{
        const authHeader = req.header("Authorization");

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({error: "No token provided. Please login."})
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)

        if(!user){
            return res.status(401).json({error: "User not found. Token invalid."})
        }

        req.user = user;
        req.userId = user._id;
        next();
    }
    catch(error){
        if (error.name === "JsonWebTokenError"){
            return res.status(401).json({error: "Invalid token"})
        }

        if (error.name === "TokenExpiredError"){
            return res.status(401).json({error: "Token expired"})
        }
        return res.status(500).json({error: "Auth failed"})
    }
}

// genrate jwt
const generateToken = (userId) => {
    return jwt.sign({userId} , process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    })
}

module.exports = {authMiddleware, generateToken}