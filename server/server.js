require('dotenv').config()
const envConfig = require('./config/env.config')
const express = require('express')
const app = express()
const http = require('http')
const crypto = require('crypto')
const passport = require('./config/passport')

// Import Security Packages
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

// Import Redis Client
const redisClient = require('./config/redis')

// Import Logger
const { logSecurityEvent } = require('./utils/logger')

// Import Database Connection
const connectDB = require('./config/db')

// Import Middleware
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

// Import Admin Perimeter (Moving Target Defense engine)
// NOTE: adminPerimeter.js throws on startup if ADMIN_SECRET_PEPPER is missing/short.
//       This is intentional — fail fast rather than boot with a broken perimeter.
const { getCurrentAdminPath, HONEYPOT_PATHS } = require('./modules/adminPerimeter/adminPerimeter')
const {
  frontGateFilter,
  checkDynamicRoute,
  tarpitTrap,
} = require('./modules/adminPerimeter/adminPerimeter.middleware')

// Import Routers
const wikiRouter = require('./modules/wiki/wiki.route')
const nextTrackRouter = require('./modules/soundtrack/soundtrack.route')
const characterRouter = require('./modules/characters/character.route')
const authRouter = require('./modules/auth/auth.route')
const legalRouter = require('./modules/legal/legal.route')

// Allowed Origins & Options
const isProd = envConfig.NODE_ENV === 'production'
const allowedOrigins = isProd
  ? [envConfig.FRONTEND_URL]
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    envConfig.FRONTEND_URL,
  ].filter(Boolean)

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

// In test mode supertest creates its own ephemeral HTTP server, so we only
// need the bare Express app. Skipping socket.io + http.Server here removes
// the open handles that keep Jest workers alive after tests finish.
let server
let io

if (envConfig.NODE_ENV !== 'test') {
  const { Server } = require('socket.io')
  server = http.createServer(app)
  io = new Server(server, { cors: corsOptions })

  // Redis-backed counter: safe across multiple server instances (Render scale-out)
  io.on('connection', async (socket) => {
    logSecurityEvent('SOCKET_CONNECT', { socketId: socket.id, ip: socket.handshake.address })
    try {
      const count = await redisClient.incr('online:users')
      io.emit('update_user_count', count)
    } catch {
      io.emit('update_user_count', 0)
    }
    socket.on('disconnect', async () => {
      logSecurityEvent('SOCKET_DISCONNECT', { socketId: socket.id })
      try {
        const count = await redisClient.decr('online:users')
        io.emit('update_user_count', Math.max(0, count))
      } catch {
        io.emit('update_user_count', 0)
      }
    })
  })
}

// ─── PERIMETER LAYER 1: One-Strike Front Gate ────────────────────────────────
// Must be the FIRST middleware registered — runs before helmet, body parsers,
// CORS, and rate-limiting. Blacklisted IPs are killed at the raw TCP socket
// level with zero HTTP overhead (req.socket.destroy()).
app.use(frontGateFilter)

// Generate a random nonce per request for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64')
  next()
})

// ─── Middleware Order (DO NOT REORDER without reading this) ──────────────────
// 1. helmet  — sets security headers BEFORE any response can be sent
// 2. trust proxy — must be before rateLimit so req.ip is the real client IP
// 3. rateLimit — runs before body parsing to reject cheap (no-parse) early
// 4. express.json — parses body; AFTER rateLimit so rejected reqs are cheap
// 5. cookieParser — needed by OAuth session + refresh cookie reads
// 6. cors — must be BEFORE passport; preflight OPTIONS must pass CORS check
//           or OAuth redirects fail with "Not allowed by CORS"
// 7. passport — needs CORS headers already set for redirect flows
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    // Force HSTS even during local development audits
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Strict CSP Directives
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
    // Strictly prevent framing/clickjacking
    frameguard: {
      action: 'deny',
    },
  })
)
app.set('trust proxy', 1)
const { limiter } = require('./middleware/rate-limiter')
app.use(limiter)
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(cors(corsOptions))

const { generateCsrfToken, validateCsrfToken } = require('./middleware/csrf')
app.use(generateCsrfToken)
app.use(validateCsrfToken)

app.use(passport.initialize())

// ─── PERIMETER LAYER 2: Honeypot Tarpit ─────────────────────────────────────
// Mount BEFORE application routes. Any request to a known scanner bait path
// is immediately absorbed by the tarpit — legitimate routes are never reached.
// The tarpit also blacklists the offending IP so all future requests are
// killed at Layer 1 (frontGateFilter) with zero overhead.
app.use(HONEYPOT_PATHS, tarpitTrap)

// 2. Routes
app.use('/api/v1/wiki', wikiRouter)
app.use('/api/v1/wiki/soundtrack', nextTrackRouter)
app.use('/api/v1/wiki/characters', characterRouter)
app.use('/api/v1/wiki/auth', authRouter)
app.use('/api/v1/legal', legalRouter)

// ─── PERIMETER LAYER 3: Rolling Admin Route ──────────────────────────────────
// The admin path rotates every 60 seconds via HMAC-SHA256(PEPPER, window).
// An invalid/expired token triggers tarpitTrap and blacklists the IP.
// Mount AFTER application routes to avoid interfering with public API paths.
app.use('/api/v1/admin/:token', checkDynamicRoute, (_req, res) => {
  // Placeholder: replace this handler with your real admin router
  res.json({ ok: true, message: 'Admin perimeter validated' })
})

// 3. Error Handling
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

// 4. Connect Database
const port = envConfig.PORT || 3000

const start = async () => {
  try {
    await connectDB(envConfig.MONGO_URI)
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}...`)

      // Log the current rolling admin path so the admin knows where to go.
      // In production, pipe this to a secure internal channel (not stdout).
      const { path: adminPath, expiresInMs } = getCurrentAdminPath()
      logSecurityEvent('PERIMETER_ADMIN_PATH', {
        adminPath,
        expiresInMs,
        note: 'This path rotates every 60 seconds. Do not share it.',
      })
    })
  } catch (error) {
    console.log('Connection failed: ', error.message)
    process.exit(1)
  }
}

if (envConfig.NODE_ENV !== 'test') {
  start()
}

module.exports = app
