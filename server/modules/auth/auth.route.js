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

// ─── Temporary OAuth Session for State/PKCE ───────────────────────────────────
const session = require('express-session')
const { RedisStore } = require('connect-redis')
const redisClient = require('../../config/redis')

const oauthSessionStore =
  envConfig.NODE_ENV === 'test'
    ? undefined // express-session defaults to MemoryStore — no Redis needed in tests
    : new RedisStore({ client: redisClient })

const oauthSession = session({
  store: oauthSessionStore,
  secret: envConfig.JWT_REFRESH_SECRET || 'oauth-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: envConfig.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes max for auth flow
  },
})

// Apply oauthSession only to OAuth routes
router.use('/google', oauthSession)
router.use('/x', oauthSession)
router.use('/discord', oauthSession)
router.use('/github', oauthSession)

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const { authLimiter } = require('../../middleware/rate-limiter')

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
  logout,
  deleteAccount,
} = authController

// ─── Standard auth routes ──────────────────────────────────────────────────────
router.post('/register', authLimiter, validateRequest(registerSchema), register)
router.post('/login', authLimiter, validateRequest(loginSchema), login)
router.post('/refresh', authLimiter, refresh)

router.post('/logout', logout)

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  requireGoogleOAuthConfig,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)
router.get(
  '/google/callback',
  requireGoogleOAuthConfig,
  passport.authenticate('google', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?googleError=1`,
    session: false,
  }),
  googleLoginCallback
)

// ─── Twitter/X OAuth ───────────────────────────────────────────────────────────
router.get(
  '/x',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', { scope: ['tweet.read', 'users.read'], session: false })
)
router.get(
  '/x/callback',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?twitterError=1`,
    session: false,
  }),
  twitterLoginCallback
)

// ─── Discord OAuth ─────────────────────────────────────────────────────────────
router.get('/discord', requireDiscordOAuthConfig, passport.authenticate('discord', { session: false }))
router.get(
  '/discord/callback',
  requireDiscordOAuthConfig,
  function discordOAuthCallbackHandler(req, res, next) {
    const frontendUrl = envConfig.FRONTEND_URL || 'http://localhost:5173'
    passport.authenticate('discord', { session: false }, (err, user) => {
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
router.delete('/me', authenticateUser, deleteAccount)
router.put('/avatar', authenticateUser, upload.single('avatar'), updateAvatar)
router.put(
  '/profile',
  authenticateUser,
  validateRequest(updateProfileSchema),
  updateProfile
)

module.exports = router
