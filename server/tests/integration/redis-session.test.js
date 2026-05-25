const express = require('express')
const request = require('supertest')
const session = require('express-session')
const { RedisStore } = require('connect-redis')

const mockRedisStore = new Map()
let simulateError = false

const mockClient = {
  isOpen: true,
  connect: jest.fn().mockImplementation(async () => {
    if (simulateError) {
      throw new Error('Connection failed')
    }
  }),
  disconnect: jest.fn().mockResolvedValue(),
  quit: jest.fn().mockResolvedValue(),
  on: jest.fn().mockReturnThis(),
  get: jest.fn().mockImplementation(async (key) => {
    if (simulateError) {
      throw new Error('Redis get error')
    }
    return mockRedisStore.get(key) || null
  }),
  set: jest.fn().mockImplementation(async (key, val) => {
    if (simulateError) {
      throw new Error('Redis set error')
    }
    mockRedisStore.set(key, val)
    return 'OK'
  }),
  setEx: jest.fn().mockImplementation(async (key, seconds, val) => {
    if (simulateError) {
      throw new Error('Redis setEx error')
    }
    mockRedisStore.set(key, val)
    return 'OK'
  }),
  del: jest.fn().mockImplementation(async (key) => {
    if (simulateError) {
      throw new Error('Redis del error')
    }
    const keys = Array.isArray(key) ? key : [key]
    let count = 0
    for (const k of keys) {
      if (mockRedisStore.has(k)) {
        mockRedisStore.delete(k)
        count++
      }
    }
    return count
  }),
}

jest.mock('../../config/redis', () => mockClient)

const redisClient = require('../../config/redis')
const errorHandlerMiddleware = require('../../middleware/error-handler')

const app = express()

app.use(express.json())
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
)

app.post('/test/login', (req, res) => {
  req.session.userId = '123'
  res.status(200).json({ success: true })
})

app.get('/test/profile', (req, res) => {
  if (req.session && req.session.userId) {
    res.status(200).json({ userId: req.session.userId })
  } else {
    res.status(401).json({ error: 'unauthorized' })
  }
})

app.post('/test/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'failed' })
    }
    res.clearCookie('connect.sid')
    res.status(200).json({ success: true })
  })
})

app.use(errorHandlerMiddleware)

describe('Redis Session Middleware with Connect-Redis', () => {
  afterEach(() => {
    jest.clearAllMocks()
    mockRedisStore.clear()
    simulateError = false
  })

  describe('Session Creation', () => {
    it('should create session and return cookie', async () => {
      const res = await request(app).post('/test/login').send()

      expect(res.status).toBe(200)
      expect(res.headers['set-cookie']).toBeDefined()
      expect(res.headers['set-cookie'][0]).toContain('connect.sid')
      expect(mockRedisStore.size).toBe(1)
    })
  })

  describe('Session Persistence (Cache Hit)', () => {
    it('should persist session across requests', async () => {
      const loginRes = await request(app).post('/test/login').send()
      const cookie = loginRes.headers['set-cookie'][0]

      const profileRes = await request(app)
        .get('/test/profile')
        .set('Cookie', cookie)

      expect(profileRes.status).toBe(200)
      expect(profileRes.body.userId).toBe('123')
    })
  })

  describe('Session Destruction (Logout)', () => {
    it('should destroy session and clear key from redis', async () => {
      const loginRes = await request(app).post('/test/login').send()
      const cookie = loginRes.headers['set-cookie'][0]

      const logoutRes = await request(app)
        .post('/test/logout')
        .set('Cookie', cookie)

      expect(logoutRes.status).toBe(200)
      expect(mockRedisStore.size).toBe(0)

      const profileRes = await request(app)
        .get('/test/profile')
        .set('Cookie', cookie)

      expect(profileRes.status).toBe(401)
    })
  })

  describe('Redis Connection Failure (Error Handling)', () => {
    it('should handle redis errors gracefully and not crash', async () => {
      const loginRes = await request(app).post('/test/login').send()
      const cookie = loginRes.headers['set-cookie'][0]

      simulateError = true

      const res = await request(app)
        .get('/test/profile')
        .set('Cookie', cookie)

      expect(res.status).toBe(500)
    })
  })
})

