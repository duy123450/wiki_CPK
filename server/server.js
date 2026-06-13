require('dotenv').config()
const envConfig = require('./config/env.config')
const express = require('express')
const app = express()
const http = require('http')
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

// Import Routers
const wikiRouter = require('./modules/wiki/wiki.route')
const nextTrackRouter = require('./modules/soundtrack/soundtrack.route')
const characterRouter = require('./modules/characters/character.route')
const authRouter = require('./modules/auth/auth.route')

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
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
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
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: (req, res, next, options) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip: req.ip, path: req.originalUrl })
    res.status(options.statusCode).send(options.message)
  }
})
)
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(passport.initialize())

// 2. Routes
app.use('/api/v1/wiki', wikiRouter)
app.use('/api/v1/wiki/soundtrack', nextTrackRouter)
app.use('/api/v1/wiki/characters', characterRouter)
app.use('/api/v1/wiki/auth', authRouter)

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
