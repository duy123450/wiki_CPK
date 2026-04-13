const Soundtrack = require('../models/sound-track.model');
const asyncWrapper = require('../middleware/async');

// ─── Helper: format a track document into a clean response ───────────────────
const formatTrack = (track) => ({
    _id: track._id,
    trackNumber: track.trackNumber,
    title: track.title,
    vocal: track.vocal,
    producer: track.producer,
    trackType: track.trackType,
    youtubeId: track.youtubeId,
    startTime: track.startTime,
    endTime: track.endTime,
    embedUrl: track.embedUrl, // virtual from schema
    coverImage: track.coverImage ?? null,
});

// ─── Controller ──────────────────────────────────────────────────────────────
// GET /api/v1/wiki/soundtrack/next
// Query params: currentTrackId, mode, movieId
//
// mode values:
//   "sequential"   → trackNumber + 1, wraps to 1 on last track
//   "shuffle"      → random track from same movie, never the current one
//   "infinite"     → return the current track again (frontend restarts it)
const getNextTrack = asyncWrapper(async (req, res) => {
    const { currentTrackId, mode, movieId } = req.query;

    // ── Validate required params ──────────────────────────────────────────────
    if (!currentTrackId || !mode || !movieId) {
        return res.status(400).json({
            msg: 'currentTrackId, mode, and movieId are all required query parameters.',
        });
    }

    const validModes = ['sequential', 'shuffle', 'infinite'];
    if (!validModes.includes(mode)) {
        return res.status(400).json({
            msg: `Invalid mode. Must be one of: ${validModes.join(', ')}.`,
        });
    }

    // ── Fetch the current track ───────────────────────────────────────────────
    const currentTrack = await Soundtrack.findOne({
        _id: currentTrackId,
        movie: movieId,
    });

    if (!currentTrack) {
        return res.status(404).json({
            msg: 'Track not found. Check currentTrackId and movieId.',
        });
    }

    // ── INFINITE LOOP ─────────────────────────────────────────────────────────
    if (mode === 'infinite') {
        return res.status(200).json({
            mode,
            track: formatTrack(currentTrack),
            restart: true,
        });
    }

    // ── Count how many tracks exist for this movie ────────────────────────────
    const totalTracks = await Soundtrack.countDocuments({ movie: movieId });

    // Edge case: only one track in the movie
    if (totalTracks === 1) {
        return res.status(200).json({
            mode,
            track: formatTrack(currentTrack),
            restart: true,
            note: 'Only one track exists for this movie; looping back.',
        });
    }

    // ── SHUFFLE ───────────────────────────────────────────────────────────────
    if (mode === 'shuffle') {
        const [randomDoc] = await Soundtrack.aggregate([
            {
                $match: {
                    movie: currentTrack.movie,
                    _id: { $ne: currentTrack._id },
                },
            },
            { $sample: { size: 1 } },
        ]);

        const randomTrack = await Soundtrack.findById(randomDoc._id);

        return res.status(200).json({
            mode,
            track: formatTrack(randomTrack),
        });
    }

    // ── SEQUENTIAL ────────────────────────────────────────────────────────────
    if (mode === 'sequential') {
        let nextTrack = await Soundtrack.findOne({
            movie: movieId,
            trackNumber: currentTrack.trackNumber + 1,
        });

        if (!nextTrack) {
            nextTrack = await Soundtrack.findOne({ movie: movieId, trackNumber: 1 });
        }

        if (!nextTrack) {
            nextTrack = await Soundtrack.findOne({ movie: movieId }).sort({ trackNumber: 1 });
        }

        return res.status(200).json({
            mode,
            track: formatTrack(nextTrack),
            wrapped: nextTrack.trackNumber === 1 && currentTrack.trackNumber !== 1,
        });
    }
});

// GET /api/v1/wiki/soundtrack
// Query params: movieId
// Fetch all tracks for a given movie
const getSoundtracks = asyncWrapper(async (req, res) => {
    const { movieId } = req.query;

    if (!movieId) {
        return res.status(400).json({
            msg: 'movieId query parameter is required.',
        });
    }

    const tracks = await Soundtrack.find({ movie: movieId }).sort({ trackNumber: 1 });

    res.status(200).json({
        tracks: tracks.map(formatTrack),
    });
});

module.exports = { getNextTrack, getSoundtracks };