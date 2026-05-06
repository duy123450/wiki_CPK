const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const passport = require("../config/passport");

const {
  register,
  login,
  googleLoginCallback,
  twitterLoginCallback,
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

const requireTwitterOAuthConfig = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const clientId = isProduction
    ? process.env.X_PROD_CLIENT_ID
    : process.env.X_LOCAL_CLIENT_ID;
  const clientSecret = isProduction
    ? process.env.X_PROD_CLIENT_SECRET
    : process.env.X_LOCAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: isProduction
        ? "Twitter OAuth is not configured. Set X_PROD_CLIENT_ID and X_PROD_CLIENT_SECRET in server/.env."
        : "Twitter OAuth is not configured. Set X_LOCAL_CLIENT_ID and X_LOCAL_CLIENT_SECRET in server/.env.",
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
  }),
);
router.get(
  "/google/callback",
  requireGoogleOAuthConfig,
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth?googleError=1`,
  }),
  googleLoginCallback,
);
router.get(
  "/x",
  requireTwitterOAuthConfig,
  passport.authenticate("twitter", {
    scope: ['tweet.read', 'users.read'],
  }),
);
router.get(
  "/x/callback",
  requireTwitterOAuthConfig,
  passport.authenticate("twitter", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth?twitterError=1`,
  }),
  twitterLoginCallback,
);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;
