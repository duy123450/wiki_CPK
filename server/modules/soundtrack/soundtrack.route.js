const express = require('express')
const router = express.Router()

const { getNextTrack, getSoundtracks, getSoundtrackBySlug } = require('./soundtrack.controller')
const validateRequest = require('../../middleware/validateRequest')
const {
  soundtrackListQuerySchema,
  soundtrackNextQuerySchema,
  soundtrackSlugParamSchema,
} = require('../../schemas/soundtrack.schemas')
const { cacheData } = require('../../middleware/cache')
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
  cacheData('soundtracks', 3600, soundtrackCacheTier),
  getSoundtracks
)

// GET /api/v1/wiki/soundtrack/:slug
router.get(
  '/:slug',
  proxyLimiter,
  optionalAuth,
  validateRequest(soundtrackSlugParamSchema),
  cacheData('soundtracks', 3600, soundtrackCacheTier),
  getSoundtrackBySlug
)

module.exports = router
