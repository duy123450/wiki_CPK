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

const proxyLimiter = leakyBucketLimiter(redisClient, { capacity: 10, leakRate: 2 })

// GET /api/v1/wiki/soundtrack/next
// ?currentTrackId=<id>&mode=sequential|shuffle|infinite&movieId=<id>
router.get('/next', proxyLimiter, validateRequest(soundtrackNextQuerySchema), getNextTrack)

// GET /api/v1/wiki/soundtrack?movieId=<id>
router.get('/', proxyLimiter, validateRequest(soundtrackListQuerySchema), cacheData('soundtracks', 3600), getSoundtracks)

// GET /api/v1/wiki/soundtrack/:slug
router.get('/:slug', proxyLimiter, validateRequest(soundtrackSlugParamSchema), cacheData('soundtracks', 3600), getSoundtrackBySlug)

module.exports = router
