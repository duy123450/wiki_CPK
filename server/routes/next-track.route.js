const express = require('express');
const router = express.Router();

const { getNextTrack, getSoundtracks } = require('../controllers/next-track.controller');

// GET /api/v1/wiki/soundtrack/next
// ?currentTrackId=<id>&mode=sequential|shuffle|infinite&movieId=<id>
router.get('/next', getNextTrack);

// GET /api/v1/wiki/soundtrack?movieId=<id>
router.get('/', getSoundtracks);

module.exports = router;