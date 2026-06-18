const express = require('express')
const router = express.Router()

const { getNextTrack, getSoundtracks, getSoundtrackBySlug } = require('./soundtrack.controller')
const validateRequest = require('../../middleware/validateRequest')
const {
  soundtrackListQuerySchema,
  soundtrackNextQuerySchema,
  soundtrackSlugParamSchema,
} = require('../../schemas/soundtrack.schemas')
const { cacheData, invalidateCache } = require('../../middleware/cache')
const { leakyBucketLimiter } = require('../../middleware/leakyBucket')
const redisClient = require('../../config/redis')
const optionalAuth = require('../../middleware/optionalAuth')
const { ROLES } = require('../../constants/roles')

const proxyLimiter = leakyBucketLimiter(redisClient, { capacity: 10, leakRate: 2 })

const soundtrackCacheTier = (req) => {
  const isDev = process.env.NODE_ENV === 'development'
  const isAdmin = req.user?.role === ROLES.ADMIN
  return isDev || isAdmin ? 'privileged' : 'public'
}

// Cache TTL: 5 minutes in dev, 10 minutes in production
// This ensures stale data from direct MongoDB Atlas updates is purged quickly
const CACHE_TTL = process.env.NODE_ENV === 'development' ? 300 : 600

// GET /api/v1/wiki/soundtrack/next
router.get(
  '/next',
  proxyLimiter,
  optionalAuth,
  validateRequest(soundtrackNextQuerySchema),
  getNextTrack
)

// GET /api/v1/wiki/soundtrack?movieId=<id>
router.get(
  '/',
  proxyLimiter,
  optionalAuth,
  validateRequest(soundtrackListQuerySchema),
  cacheData('soundtracks', CACHE_TTL, soundtrackCacheTier),
  getSoundtracks
)

// GET /api/v1/wiki/soundtrack/:slug
router.get(
  '/:slug',
  proxyLimiter,
  optionalAuth,
  validateRequest(soundtrackSlugParamSchema),
  cacheData('soundtracks', CACHE_TTL, soundtrackCacheTier),
  getSoundtrackBySlug
)

// POST /api/v1/wiki/soundtrack/cache/clear (admin only)
// Manual endpoint to clear soundtrack cache immediately after direct MongoDB Atlas updates
router.post('/cache/clear', optionalAuth, invalidateCache('soundtracks'), (req, res) => {
  if (req.user?.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Admins only' })
  }
  res.status(200).json({ message: 'Soundtrack cache cleared' })
})

module.exports = router
