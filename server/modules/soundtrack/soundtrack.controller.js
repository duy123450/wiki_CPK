const soundtrackService = require('./soundtrack.service');
const asyncWrapper = require('../../middleware/async');

const getNextTrack = asyncWrapper(async (req, res) => {
    // Service handles sequential, shuffle, and infinite logic
    const result = await soundtrackService.getNextTrackLogic(req.query);
    res.status(200).json(result);
});

const getSoundtracks = asyncWrapper(async (req, res) => {
    const { movieId } = req.query;
    const tracks = await soundtrackService.fetchTracksByMovie(movieId);
    res.status(200).json({ tracks });
});

module.exports = { getNextTrack, getSoundtracks };