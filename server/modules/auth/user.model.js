const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const envConfig = require("../../config/env.config");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: function () {
            // Password is only required when there is no Google ID, X ID, Discord ID or GitHub ID
            return !this.googleId && !this.xId && !this.discordId && !this.githubId;
        },
        minlength: 6,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // allows multiple docs to have null/undefined
    },
    xId: {
        type: String,
        unique: true,
        sparse: true, // allows multiple docs to have null/undefined
    },
    discordId: {
        type: String,
        unique: true,
        sparse: true,
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true,
    },
    refreshToken: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'user'],
        default: 'user',
    },
    // --- FIXED AVATAR SECTION ---
    avatar: {
        url: {
            type: String,
            default: 'https://res.cloudinary.com/dvlaoxjzi/image/upload/v1775612971/default-avatar-photo-placeholder-profile-icon-vector_c0iz1k.webp'
        },
        public_id: {
            type: String,
            default: 'default-avatar-photo-placeholder-profile-icon-vector_c0iz1k'
        }
    },
    favoriteCharacter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character'
    }
}, { timestamps: true });

// Hash password with Argon2
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const hashOptions = process.env.NODE_ENV === 'test' 
        ? { timeCost: 1, memoryCost: 8, parallelism: 1 } 
        : {};
    this.password = await argon2.hash(this.password, hashOptions);
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await argon2.verify(this.password, candidatePassword);
};

UserSchema.methods.createAccessToken = function () {
    return jwt.sign(
        { userId: this._id, name: this.username, role: this.role },
        envConfig.JWT_ACCESS_SECRET,
        { expiresIn: envConfig.JWT_ACCESS_LIFETIME || '15m' }
    );
};

UserSchema.methods.createRefreshToken = function () {
    return jwt.sign(
        { userId: this._id },
        envConfig.JWT_REFRESH_SECRET,
        { expiresIn: envConfig.JWT_REFRESH_LIFETIME || '30d' }
    );
};

UserSchema.methods.createJWT = UserSchema.methods.createAccessToken;

module.exports = mongoose.model('User', UserSchema);
