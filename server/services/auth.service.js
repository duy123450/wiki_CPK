const User = require("../models/user.model");
const { createCustomError } = require("../errors/custom-error");

const buildAuthResponse = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
});

const buildTokenResponse = async (user) => {
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return {
        user: buildAuthResponse(user),
        accessToken,
        token: accessToken,
        refreshToken,
    };
};

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

    return buildTokenResponse(user);
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

    return buildTokenResponse(user);
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

    if (user.avatar?.public_id && user.avatar.public_id !== DEFAULT_PUBLIC_ID) {
        const { cloudinary } = require("../config/cloudinary");
        await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    user.avatar = {
        url: file.path,
        public_id: file.filename,
    };

    await user.save();
    return { avatar: user.avatar };
};

const updateUserProfile = async (userId, updates) => {
    const user = await User.findById(userId);
    if (!user) throw createCustomError("User not found", 404);

    const { username, email, currentPassword, newPassword } = updates;

    if (username && username.trim() !== user.username) {
        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 20) {
            throw createCustomError("Username must be 3-20 characters", 400);
        }
        const taken = await User.findOne({ username: trimmed, _id: { $ne: userId } });
        if (taken) throw createCustomError("Username already taken", 400);
        user.username = trimmed;
    }

    if (email && email.toLowerCase().trim() !== user.email) {
        const normalized = email.toLowerCase().trim();
        const taken = await User.findOne({ email: normalized, _id: { $ne: userId } });
        if (taken) throw createCustomError("Email already in use", 400);
        user.email = normalized;
    }

    if (newPassword) {
        if (!currentPassword) {
            throw createCustomError("Current password is required to set a new one", 400);
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw createCustomError("Current password is incorrect", 401);
        if (newPassword.length < 6) {
            throw createCustomError("New password must be at least 6 characters", 400);
        }
        user.password = newPassword;
    }

    await user.save();

    return buildTokenResponse(user);
};

const googleLoginUser = async (profile) => {
    if (!profile?.id) {
        throw createCustomError("Google profile is required", 400);
    }

    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
        throw createCustomError("Google account email is required", 400);
    }

    const googleId = profile.id;
    const name = profile.displayName || email.split("@")[0];
    const picture = profile.photos?.[0]?.value;

    let user = await User.findOne({
        $or: [{ googleId }, { email }],
    });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
    } else {
        const suffix = "_" + googleId.slice(-4);
        const baseName = name.replace(/\s+/g, "_").slice(0, 20 - suffix.length);
        user = await User.create({
            username: baseName + suffix,
            email,
            googleId,
            avatar: {
                url: picture || undefined,
                public_id: "google-avatar",
            },
        });
    }

    return buildTokenResponse(user);
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw createCustomError("Refresh token is required", 401);
    }

    const jwt = require("jsonwebtoken");
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw createCustomError("Refresh token is invalid", 401);
    }

    const user = await User.findOne({ _id: payload.userId, refreshToken });
    if (!user) {
        throw createCustomError("Refresh token is invalid", 401);
    }

    const accessToken = user.createAccessToken();

    return {
        user: buildAuthResponse(user),
        accessToken,
        token: accessToken,
    };
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUserAvatar,
    updateUserProfile,
    googleLoginUser,
    refreshAccessToken,
};
