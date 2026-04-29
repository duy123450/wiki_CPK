const authService = require("../services/auth.service");

const register = async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.status(200).json(result);
};

const getCurrentUser = async (req, res) => {
  // req.user is populated by your authentication middleware
  const result = await authService.getUserById(req.user.userId);
  res.status(200).json(result);
};

module.exports = { register, login, getCurrentUser };