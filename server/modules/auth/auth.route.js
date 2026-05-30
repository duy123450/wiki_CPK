/**
 * Auth routes — routing definitions only.
 *
 * OAuth strategy logic lives in ./strategies/*.js (one file per provider).
 * Rate limiting, validation, and controller wiring happen here.
 * No strategy factories defined inline.
 */
const express = require('express')
const router = express.Router()
const envConfig = require('../../config/env.config')
const passport = require('../../config/passport')
const { upload } = require('../../config/cloudinary')
const authController = require('./auth.controller')
const authenticateUser = require('../../middleware/authentication')
const validateRequest = require('../../middleware/validateRequest')
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('../../schemas/auth.schemas')

// ─── OAuth strategy middleware (lazy registration — one file per provider) ────
const requireGoogleOAuthConfig  = require('./strategies/google')
const requireTwitterOAuthConfig = require('./strategies/twitter')
const requireDiscordOAuthConfig = require('./strategies/discord')
const requireGitHubOAuthConfig  = require('./strategies/github')

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit')
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: envConfig.NODE_ENV === 'test' ? 1000 : 5,
  message: { msg: 'Too many authentication attempts, please try again after 15 minutes' },
})

// ─── Controller methods ────────────────────────────────────────────────────────
const {
  register,
  login,
  refresh,
  getCurrentUser,
  googleLoginCallback,
  twitterLoginCallback,
  discordLoginCallback,
  githubLoginCallback,
  updateAvatar,
  updateProfile,
} = authController

// ─── Standard auth routes ──────────────────────────────────────────────────────
router.post('/register', validateRequest(registerSchema), register)
router.post('/login', authLimiter, validateRequest(loginSchema), login)
router.post('/refresh', authLimiter, refresh)

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  requireGoogleOAuthConfig,
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get(
  '/google/callback',
  requireGoogleOAuthConfig,
  passport.authenticate('google', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?googleError=1`,
  }),
  googleLoginCallback
)

// ─── Twitter/X OAuth ───────────────────────────────────────────────────────────
router.get(
  '/x',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', { scope: ['tweet.read', 'users.read'] })
)
router.get(
  '/x/callback',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?twitterError=1`,
  }),
  twitterLoginCallback
)

// ─── Discord OAuth ─────────────────────────────────────────────────────────────
router.get('/discord', requireDiscordOAuthConfig, passport.authenticate('discord'))
router.get(
  '/discord/callback',
  requireDiscordOAuthConfig,
  function discordOAuthCallbackHandler(req, res, next) {
    const frontendUrl = envConfig.FRONTEND_URL || 'http://localhost:5173'
    passport.authenticate('discord', (err, user) => {
      if (err) {
        if (err.message === 'email_taken_other_method') {
          return res.redirect(`${frontendUrl}/auth?error=social_conflict`)
        }
        return res.redirect(
          `${frontendUrl}/auth?discordError=1&msg=${encodeURIComponent(err.message)}`
        )
      }
      if (!user) return res.redirect(`${frontendUrl}/auth?discordError=1`)
      req.user = user
      next()
    })(req, res, next)
  },
  discordLoginCallback
)

// ─── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/github',
  requireGitHubOAuthConfig,
  passport.authenticate('github', { scope: ['user:email'], session: false })
)
router.get(
  '/github/callback',
  requireGitHubOAuthConfig,
  function githubOAuthCallbackHandler(req, res, next) {
    const frontendUrl = envConfig.FRONTEND_URL || 'http://localhost:5173'
    passport.authenticate('github', { session: false }, (err, user) => {
      if (err) {
        if (err.message === 'email_taken_other_method') {
          return res.redirect(`${frontendUrl}/auth?error=social_conflict`)
        }
        return res.redirect(
          `${frontendUrl}/auth?githubError=1&msg=${encodeURIComponent(err.message)}`
        )
      }
      if (!user) return res.redirect(`${frontendUrl}/auth?githubError=1`)
      req.user = user
      next()
    })(req, res, next)
  },
  githubLoginCallback
)

// ─── Protected user routes ─────────────────────────────────────────────────────
router.get('/me', authenticateUser, getCurrentUser)
router.put('/avatar', authenticateUser, upload.single('avatar'), updateAvatar)
router.put(
  '/profile',
  authenticateUser,
  validateRequest(updateProfileSchema),
  updateProfile
)

module.exports = router
