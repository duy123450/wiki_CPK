const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
        required: [true, 'Please provide a password'],
        minlength: 6,
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
    this.password = await argon2.hash(this.password);
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await argon2.verify(this.password, candidatePassword);
};

// Create JWT
UserSchema.methods.createJWT = function () {
    return jwt.sign(
        { userId: this._id, name: this.username, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFETIME }
    );
};

module.exports = mongoose.model('User', UserSchema);