const soundtrackService = require('./soundtrack.service')
const asyncWrapper = require('../../middleware/async')

const getNextTrack = asyncWrapper(async (req, res) => {
  const result = await soundtrackService.getNextTrackLogic(req.query, req.user)
  res.status(200).json(result)
})

const getSoundtracks = asyncWrapper(async (req, res) => {
  const { movieId } = req.query
  const tracks = await soundtrackService.fetchTracksByMovie(movieId, req.user)
  res.status(200).json({ tracks })
})

const getSoundtrackBySlug = asyncWrapper(async (req, res) => {
  const track = await soundtrackService.fetchTrackBySlug(req.params.slug, req.user)
  res.status(200).json({ track })
})

module.exports = { getNextTrack, getSoundtracks, getSoundtrackBySlug }
