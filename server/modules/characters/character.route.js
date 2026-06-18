const express = require('express')
const router = express.Router()

const {
  getAllCharacters,
  getCharacterBySlug,
  getCharacterRoles,
} = require('./character.controller')
const validateRequest = require('../../middleware/validateRequest')
const { characterQuerySchema } = require('../../schemas/character.schemas')
const { cacheData, invalidateCache } = require('../../middleware/cache')
const { leakyBucketLimiter } = require('../../middleware/leakyBucket')
const redisClient = require('../../config/redis')

const characterLimiter = leakyBucketLimiter(redisClient, { capacity: 50, leakRate: 10 })

// Cache TTL: 5 minutes in dev, 10 minutes in production
// This ensures stale data from direct MongoDB Atlas updates is purged quickly
const CACHE_TTL = process.env.NODE_ENV === 'development' ? 300 : 600

// GET /api/v1/wiki/characters
router.get('/', characterLimiter, validateRequest(characterQuerySchema), cacheData('characters', CACHE_TTL), getAllCharacters)

// GET /api/v1/wiki/characters/roles
router.get('/roles', characterLimiter, getCharacterRoles)

// GET /api/v1/wiki/characters/:slug
// e.g. /api/v1/wiki/characters/kaguya
router.get('/:slug', characterLimiter, cacheData('characters', CACHE_TTL), getCharacterBySlug)

// Example POST route to demonstrate cache invalidation
router.post('/', invalidateCache('characters'), (req, res) => {
  // In a real scenario, this would be a controller that creates a character
  res.status(201).json({ msg: 'Character created and cache invalidated.' })
})

module.exports = router
