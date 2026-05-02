const authService = require("../services/auth.service");

const register = async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
};

const login = async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.loginUser(identifier, password);
  res.status(200).json(result);
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  const result = await authService.googleLoginUser(credential);
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
  res.status(200).json(result);
};

module.exports = { register, login, googleLogin, getCurrentUser, updateAvatar, updateProfile };