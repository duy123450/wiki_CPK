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

// GET /api/v1/wiki/soundtrack/next
// ?currentTrackId=<id>&mode=sequential|shuffle|infinite&movieId=<id>
router.get('/next', validateRequest(soundtrackNextQuerySchema), getNextTrack)

// GET /api/v1/wiki/soundtrack?movieId=<id>
router.get('/', validateRequest(soundtrackListQuerySchema), cacheData('soundtracks', 3600), getSoundtracks)

// GET /api/v1/wiki/soundtrack/:slug
router.get('/:slug', validateRequest(soundtrackSlugParamSchema), cacheData('soundtracks', 3600), getSoundtrackBySlug)

module.exports = router
