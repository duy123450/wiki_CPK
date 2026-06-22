const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const redisClient = require('../config/redis');
const envConfig = require('../config/env.config');

const isTest = envConfig.NODE_ENV === 'test';

// General API limiter: 1000 requests per 15 minutes for dev/e2e
const limiter = rateLimit({
  store: isTest ? undefined : new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:' // rate-limit prefix
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { msg: 'Too many requests, please try again later' },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => req.path === '/health'
});

// Auth limiter: 5 login attempts per 15 minutes
const authLimiter = rateLimit({
  store: isTest ? undefined : new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { msg: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { limiter, authLimiter };
