const User = require("../models/user.model");
const { createCustomError } = require("../errors/custom-error");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to format the user object for the client
const buildAuthResponse = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
});

const registerUser = async (userData) => {
    const { username, email, password } = userData;

    if (!username || !email || !password) {
        throw createCustomError("Username, email, and password are required", 400);
    }

    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    });

    if (existingUser) {
        throw createCustomError("Username or email already in use", 400);
    }

    const user = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
    });

    return {
        user: buildAuthResponse(user),
        token: user.createJWT(),
    };
};

const loginUser = async (identifier, password) => {
    if (!identifier || !password) {
        throw createCustomError("Email/username and password are required", 400);
    }

    const isEmail = identifier.includes("@");
    const query = isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { username: identifier.trim() };

    const user = await User.findOne(query);
    if (!user || !(await user.comparePassword(password))) {
        throw createCustomError("Invalid credentials", 401);
    }

    return {
        user: buildAuthResponse(user),
        token: user.createJWT(),
    };
};

const getUserById = async (userId) => {
    const user = await User.findById(userId).select("_id username email role avatar createdAt");
    if (!user) throw createCustomError("User not found", 404);

    return { user: buildAuthResponse(user) };
};

const DEFAULT_PUBLIC_ID = "default-avatar-photo-placeholder-profile-icon-vector_c0iz1k";

const updateUserAvatar = async (userId, file) => {
    if (!file) throw createCustomError("No file uploaded", 400);

    const user = await User.findById(userId);
    if (!user) throw createCustomError("User not found", 404);

    // Delete old Cloudinary image only if it's not the default
    if (user.avatar?.public_id && user.avatar.public_id !== DEFAULT_PUBLIC_ID) {
        const { cloudinary } = require("../config/cloudinary");
        await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    user.avatar = {
        url: file.path,           // Cloudinary URL from multer-storage-cloudinary
        public_id: file.filename, // Cloudinary public_id
    };

    await user.save();
    return { avatar: user.avatar };
};

const updateUserProfile = async (userId, updates) => {
    const user = await User.findById(userId);
    if (!user) throw createCustomError("User not found", 404);

    const { username, email, currentPassword, newPassword } = updates;

    // ── Username ────────────────────────────────────────────────────────────
    if (username && username.trim() !== user.username) {
        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 20) {
            throw createCustomError("Username must be 3–20 characters", 400);
        }
        const taken = await User.findOne({ username: trimmed, _id: { $ne: userId } });
        if (taken) throw createCustomError("Username already taken", 400);
        user.username = trimmed;
    }

    // ── Email ───────────────────────────────────────────────────────────────
    if (email && email.toLowerCase().trim() !== user.email) {
        const normalized = email.toLowerCase().trim();
        const taken = await User.findOne({ email: normalized, _id: { $ne: userId } });
        if (taken) throw createCustomError("Email already in use", 400);
        user.email = normalized;
    }

    // ── Password ────────────────────────────────────────────────────────────
    if (newPassword) {
        if (!currentPassword) {
            throw createCustomError("Current password is required to set a new one", 400);
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw createCustomError("Current password is incorrect", 401);
        if (newPassword.length < 6) {
            throw createCustomError("New password must be at least 6 characters", 400);
        }
        user.password = newPassword; // hashed by pre-save hook
    }

    await user.save();

    return {
        user: buildAuthResponse(user),
        token: user.createJWT(), // re-issue token in case username changed (embedded in JWT)
    };
};

/**
 * Verify a Google ID token, then find-or-create the user.
 * Returns { user, token } — same shape as registerUser / loginUser.
 */
const googleLoginUser = async (credential) => {
    if (!credential) {
        throw createCustomError("Google credential is required", 400);
    }

    // 1. Verify the ID token with Google's servers
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log("✅ Google user verified:", { googleId, email, name, picture });

    // 2. Find existing user by googleId or email
    let user = await User.findOne({
        $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
        // Link Google ID if user existed by email but hadn't linked Google yet
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
    } else {
        const suffix = "_" + googleId.slice(-4);
        const baseName = name.replace(/\s+/g, "_").slice(0, 20 - suffix.length);
        user = await User.create({
            username: baseName + suffix,
            email: email.toLowerCase(),
            googleId,
            avatar: {
                url: picture || undefined,
                public_id: "google-avatar",
            },
        });
    }

    return {
        user: buildAuthResponse(user),
        token: user.createJWT(),
    };
};

module.exports = { registerUser, loginUser, getUserById, updateUserAvatar, updateUserProfile, googleLoginUser };