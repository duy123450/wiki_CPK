const express = require('express')
const envConfig = require('../../config/env.config')
const router = express.Router()
const { upload } = require('../../config/cloudinary')
const passport = require('../../config/passport')
const authController = require('./auth.controller')
const authenticateUser = require('../../middleware/authentication')
const validateRequest = require('../../middleware/validateRequest')
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('../../schemas/auth.schemas')

const {
  register,
  login,
  googleLoginCallback,
  twitterLoginCallback,
  discordLoginCallback,
  githubLoginCallback,
  refresh,
  getCurrentUser,
  updateAvatar,
  updateProfile,
} = authController

const requireGoogleOAuthConfig = (req, res, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.',
    })
  }

  const GoogleStrategy = require('passport-google-oauth20').Strategy
  const { googleLoginUser } = require('./auth.service')
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/v1/wiki/auth/google/callback'

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        proxy: true,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await googleLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}

const requireTwitterOAuthConfig = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.X_PROD_CLIENT_ID || process.env.X_CLIENT_ID
    : process.env.X_LOCAL_CLIENT_ID || process.env.X_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.X_PROD_CLIENT_SECRET || process.env.X_CLIENT_SECRET
    : process.env.X_LOCAL_CLIENT_SECRET || process.env.X_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: isProduction
        ? 'Twitter OAuth is not configured. Set X_PROD_CLIENT_ID and X_PROD_CLIENT_SECRET in server/.env.'
        : 'Twitter OAuth is not configured. Set X_LOCAL_CLIENT_ID and X_LOCAL_CLIENT_SECRET in server/.env.',
    })
  }

  const TwitterStrategy = require('passport-twitter-oauth2').Strategy
  const { twitterLoginUser } = require('./auth.service')
  const callbackURL = isProduction
    ? process.env.X_PROD_CALLBACK_URL
    : `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/x/callback`

  const twitterStrategy = new TwitterStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      clientType: 'confidential',
      callbackURL: callbackURL,
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      userProfileURL: 'https://api.twitter.com/2/users/me',
      includeEmail: true,
      pkce: true,
      state: true,
      scopeSeparator: ' ',
      customHeaders: {
        Authorization:
          'Basic ' +
          Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const authResult = await twitterLoginUser(profile)
        return done(null, authResult)
      } catch (error) {
        return done(error, false)
      }
    }
  )

  twitterStrategy.userProfile = async function (accessToken, params, done) {
    if (typeof params === 'function') {
      done = params
      params = {}
    }
    try {
      const axios = require('axios')
      const response = await axios.get(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = response.data
      const text = JSON.stringify(data)

      const profile = {
        provider: 'twitter',
        id: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        photos: data.data.profile_image_url
          ? [{ value: data.data.profile_image_url }]
          : [],
        _raw: text,
        _json: data,
      }

      done(null, profile)
    } catch (error) {
      done(error)
    }
  }

  passport.use('twitter', twitterStrategy)

  return next()
}

const requireDiscordOAuthConfig = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.DISCORD_PROD_CLIENT_ID || process.env.DISCORD_CLIENT_ID
    : process.env.DISCORD_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.DISCORD_PROD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET
    : process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in server/.env.',
    })
  }

  const DiscordStrategy = require('passport-discord').Strategy
  const { discordLoginUser } = require('./auth.service')
  const callbackURL = isProduction
    ? process.env.DISCORD_PROD_CALLBACK_URL
    : process.env.DISCORD_LOCAL_CALLBACK_URL ||
      `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/discord/callback`

  passport.use(
    new DiscordStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await discordLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}

const requireGitHubOAuthConfig = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const clientId = isProduction
    ? process.env.GITHUB_PROD_CLIENT_ID
    : process.env.GITHUB_LOCAL_CLIENT_ID
  const clientSecret = isProduction
    ? process.env.GITHUB_PROD_CLIENT_SECRET
    : process.env.GITHUB_LOCAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      msg: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env.',
    })
  }

  const GitHubStrategy = require('passport-github2').Strategy
  const { githubLoginUser } = require('./auth.service')
  const callbackURL = isProduction
    ? process.env.GITHUB_PROD_CALLBACK_URL
    : process.env.GITHUB_LOCAL_CALLBACK_URL ||
      `${process.env.FRONTEND_URL?.replace(':5173', ':3000') || 'http://localhost:3000'}/api/v1/wiki/auth/github/callback`

  passport.use(
    new GitHubStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['user:email'],
        customHeaders: {
          'User-Agent': 'Wiki-CPK-App',
        },
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authResult = await githubLoginUser(profile)
          return done(null, authResult)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  return next()
}

const rateLimit = require('express-rate-limit')
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: envConfig.NODE_ENV === 'test' ? 1000 : 5, // Limit each IP to 5 requests per windowMs
  message: {
    msg: 'Too many authentication attempts, please try again after 15 minutes',
  },
})

router.post('/register', validateRequest(registerSchema), register)
router.post('/login', authLimiter, validateRequest(loginSchema), login)
router.post('/refresh', authLimiter, refresh)
router.get(
  '/google',
  requireGoogleOAuthConfig,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
)
router.get(
  '/google/callback',
  requireGoogleOAuthConfig,
  passport.authenticate('google', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?googleError=1`,
  }),
  googleLoginCallback
)
router.get(
  '/x',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read'],
  })
)
router.get(
  '/x/callback',
  requireTwitterOAuthConfig,
  passport.authenticate('twitter', {
    failureRedirect: `${envConfig.FRONTEND_URL || 'http://localhost:5173'}/auth?twitterError=1`,
  }),
  twitterLoginCallback
)
router.get(
  '/discord',
  requireDiscordOAuthConfig,
  passport.authenticate('discord')
)
router.get(
  '/discord/callback',
  requireDiscordOAuthConfig,
  (req, res, next) => {
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
      if (!user) {
        return res.redirect(`${frontendUrl}/auth?discordError=1`)
      }
      req.user = user
      next()
    })(req, res, next)
  },
  discordLoginCallback
)
router.get(
  '/github',
  requireGitHubOAuthConfig,
  passport.authenticate('github', { scope: ['user:email'], session: false })
)
router.get(
  '/github/callback',
  requireGitHubOAuthConfig,
  (req, res, next) => {
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
      if (!user) {
        return res.redirect(`${frontendUrl}/auth?githubError=1`)
      }
      req.user = user
      next()
    })(req, res, next)
  },
  githubLoginCallback
)
router.get('/me', authenticateUser, getCurrentUser)
router.put('/avatar', authenticateUser, upload.single('avatar'), updateAvatar)
router.put(
  '/profile',
  authenticateUser,
  validateRequest(updateProfileSchema),
  updateProfile
)

module.exports = router
