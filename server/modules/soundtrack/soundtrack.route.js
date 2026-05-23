const express = require('express')
const router = express.Router()

const { getNextTrack, getSoundtracks } = require('./soundtrack.controller')
const { cacheData } = require('../../middleware/cache')

// GET /api/v1/wiki/soundtrack/next
// ?currentTrackId=<id>&mode=sequential|shuffle|infinite&movieId=<id>
router.get('/next', getNextTrack) // Do not cache dynamic next track logic

// GET /api/v1/wiki/soundtrack?movieId=<id>
router.get('/', cacheData('soundtracks', 3600), getSoundtracks)

module.exports = router
