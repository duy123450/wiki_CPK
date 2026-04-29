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

const loginUser = async (email, password) => {
    if (!email || !password) {
        throw createCustomError("Email and password are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
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

module.exports = { registerUser, loginUser, getUserById };