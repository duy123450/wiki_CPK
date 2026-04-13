require('dotenv').config()
const express = require('express')
const app = express()

// Import Security Packages
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

// Import Database Connection
const connectDB = require('./config/db')

// Import Middleware
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

// Import Routers
const wikiRouter = require('./routes/wiki.route')
const nextTrackRouter = require('./routes/next-track.route')

// Allowed Origins & Options
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
]

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true)

        if(allowedOrigins.indexOf(origin) !== -1)
            callback(null, true)
        else
            callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    optionsSuccessStatus: 200
}

// 1. Security Middleware
app.set('trust proxy', 1)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}))
app.use(express.json({ limit: '10kb' }))
app.use(cors(corsOptions))
app.use(helmet())

// 2. Routes
app.use('/api/v1/wiki', wikiRouter)
app.use('/api/v1/wiki/soundtrack', nextTrackRouter)

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

start()