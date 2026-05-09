const express = require("express");
const router = express.Router();
const { upload } = require("../../config/cloudinary");
const passport = require("../../config/passport");
const authController = require("./auth.controller");
const authenticateUser = require("../../middleware/authentication");

const {
  register,
  login,
  googleLoginCallback,
  twitterLoginCallback,
  discordLoginCallback,
  refresh,
  getCurrentUser,
  updateAvatar,
  updateProfile,
} = authController;

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

const requireDiscordOAuthConfig = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const clientId = isProduction
    ? process.env.DISCORD_PROD_CLIENT_ID
    : process.env.DISCORD_CLIENT_ID;
  const clientSecret = isProduction
    ? process.env.DISCORD_PROD_CLIENT_SECRET
    : process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: "Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in server/.env.",
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
router.get(
  "/discord",
  requireDiscordOAuthConfig,
  passport.authenticate("discord"),
);
router.get(
  "/discord/callback",
  requireDiscordOAuthConfig,
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    passport.authenticate("discord", (err, user) => {
      if (err) {
        if (err.message === "email_taken_other_method") {
          return res.redirect(`${frontendUrl}/auth?error=social_conflict`);
        }
        return res.redirect(`${frontendUrl}/auth?discordError=1&msg=${encodeURIComponent(err.message)}`);
      }
      if (!user) {
        return res.redirect(`${frontendUrl}/auth?discordError=1`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  discordLoginCallback,
);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;
