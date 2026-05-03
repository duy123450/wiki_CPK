const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const passport = require("../config/passport");

const {
  register,
  login,
  googleLoginCallback,
  refresh,
  getCurrentUser,
  updateAvatar,
  updateProfile,
} = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/authentication");

const requireGoogleOAuthConfig = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      msg: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.",
    });
  }

  return next();
};

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get(
  "/google",
  requireGoogleOAuthConfig,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  requireGoogleOAuthConfig,
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth?googleError=1`,
    session: false,
  }),
  googleLoginCallback,
);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;
