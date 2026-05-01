const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");

const { register, login, getCurrentUser, updateAvatar, updateProfile } = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;
