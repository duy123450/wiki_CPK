const express = require("express");
const router = express.Router();

const { register, login, getCurrentUser, updateAvatar } = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);

module.exports = router;
