const express = require("express");
const router = express.Router();

const { register, login, getCurrentUser } = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateUser, getCurrentUser);

module.exports = router;
