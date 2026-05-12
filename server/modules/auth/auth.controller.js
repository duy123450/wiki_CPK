const authService = require("./auth.service");

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/api/v1/wiki/auth",
};

const sendAuthResponse = (res, statusCode, result) => {
  const { refreshToken, ...body } = result;
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  return res.status(statusCode).json(body);
};

const register = async (req, res) => {
  const result = await authService.registerUser(req.body);
  sendAuthResponse(res, 201, result);
};

const login = async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.loginUser(identifier, password);
  sendAuthResponse(res, 200, result);
};

const googleLoginCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { refreshToken } = req.user;
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.redirect(`${frontendUrl}/auth?oauth=success`);
};

const twitterLoginCallback = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const { refreshToken } = req.user;
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.redirect(`${frontendUrl}/auth?oauth=success`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth?twitterError=1&msg=${encodeURIComponent(error.message)}`);
  }
};

const discordLoginCallback = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const { refreshToken } = req.user;
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.redirect(`${frontendUrl}/auth?oauth=success`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth?discordError=1&msg=${encodeURIComponent(error.message)}`);
  }
};

const refresh = async (req, res) => {
  const result = await authService.refreshAccessToken(req.cookies?.refreshToken);
  res.status(200).json(result);
};

const getCurrentUser = async (req, res) => {
  // req.user is populated by your authentication middleware
  const result = await authService.getUserById(req.user.userId);
  res.status(200).json(result);
};

const updateAvatar = async (req, res) => {
  const result = await authService.updateUserAvatar(req.user.userId, req.file);
  res.status(200).json(result);
};

const updateProfile = async (req, res) => {
  const result = await authService.updateUserProfile(req.user.userId, req.body);
  sendAuthResponse(res, 200, result);
};

module.exports = {
  register,
  login,
  googleLoginCallback,
  twitterLoginCallback,
  discordLoginCallback,
  refresh,
  getCurrentUser,
  updateAvatar,
  updateProfile,
};
