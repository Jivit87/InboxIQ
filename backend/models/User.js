const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            trim: true,
        },
        
        // OAuth tokens for connected platforms (Gmail, etc.)
        // These are encrypted tokens that let us access user's Gmail on their behalf
        tokens: {
            google: {
                accessToken: String,    
                refreshToken: String,    
                expiresAt: Date,         
                scope: [String]           // permissions we have (read emails, send emails, etc.)
            }
        },
        
        connectedPlatforms: {
            gmail: {
                type: Boolean,
                default: false
            }
        },
        
        lastSync: {
            gmail: Date
        },
        
        createdAt: {
            type: Date,
            default: Date.now,
        },
        lastLogin: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,  // Automatically add updatedAt field
    }
);

// hash password
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// check password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// check if token is expired
UserSchema.methods.isTokenExpired = function (platform) {
    const tokenData = this.tokens[platform];

    if (!tokenData || !tokenData.expiresAt) {
        return true;
    }

    return new Date() >= tokenData.expiresAt;
};

module.exports = mongoose.model("User", UserSchema)
