require('dotenv').config()
const express = require('express')
const app = express()
const passport = require('./config/passport')

// Import Security Packages
const helmet = require('helmet')
const cors = require('cors')
const session = require('express-session')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

// Import Database Connection
const connectDB = require('./config/db')

// Import Middleware
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

// Import Routers
const wikiRouter = require('./routes/wiki.route')
const nextTrackRouter = require('./routes/next-track.route')
const characterRouter = require('./routes/character.route')
const authRouter = require('./routes/auth.route')

// Allowed Origins & Options
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL
]

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true)

        if (allowedOrigins.indexOf(origin) !== -1)
            callback(null, true)
        else
            callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    optionsSuccessStatus: 200
}

// 1. Security Middleware
app.set('trust proxy', 1)

// Request logging
app.use((req, res, next) => {
    if (req.url.includes('/auth')) {
        console.log(`📨 ${req.method} ${req.url}`);
    }
    next();
})

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
}))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(helmet())
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))
app.use(passport.initialize())
app.use(passport.session())

// 2. Routes
app.use('/api/v1/wiki', wikiRouter)
app.use('/api/v1/wiki/soundtrack', nextTrackRouter)
app.use('/api/v1/wiki/characters', characterRouter)
app.use('/api/v1/wiki/auth', authRouter)

// 3. Error Handling
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

// 4. Connect Database
const port = process.env.PORT || 3000

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}...`)
        })
    } catch (error) {
        console.log('Connection failed: ', error.message)
        process.exit(1)
    }
}

if (process.env.NODE_ENV !== 'test') {
    start()
}

module.exports = app
