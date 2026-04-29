const User = require("../models/user.model");
const { createCustomError } = require("../errors/custom-error");

// Helper to format the user object for the client
const buildAuthResponse = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
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
    const user = await User.findById(userId).select("_id username email role avatar");
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

module.exports = { registerUser, loginUser, getUserById, updateUserAvatar };