const Soundtrack = require('./sound-track.model')
const { WikiError, ValidationError, NotFoundError, UnauthorizedError } = require('../../errors')
const { ROLES } = require('../../constants/roles')

const PUBLIC_TRACK_LIMIT = 15

const isPrivilegedUser = (user) =>
  process.env.NODE_ENV === 'development' || (user && user.role === ROLES.ADMIN)

const normalizeMovie = (movie) => {
  if (!movie || !movie.title) return null
  return {
    _id: String(movie._id),
    title: movie.title,
  }
}

const formatTrack = (track) => {
  if (!track) return null
  return {
    _id: track._id,
    slug: track.slug,
    trackNumber: track.trackNumber,
    title: track.title,
    vocal: track.vocal,
    producer: track.producer,
    trackType: track.trackType,
    youtubeId: track.youtubeId,
    startTime: track.startTime,
    endTime: track.endTime,
    embedUrl: track.embedUrl,
    coverImage: track.coverImage?.url ?? null,
    officialUrl: track.officialUrl ?? [],
    lyrics: {
      romaji: track.lyrics?.romaji ?? '',
      translation: track.lyrics?.translation ?? '',
      translator: track.lyrics?.translator ?? '',
      source: track.lyrics?.source ?? '',
      synced: track.lyrics?.synced ?? [],
    },
    movie: normalizeMovie(track.movie),
  }
}

const fetchTracksByMovie = async (movieId, user) => {
  if (!movieId) {
    throw new ValidationError('movieId query parameter is required.')
  }

  const safeMovieId = String(movieId)
  const privileged = isPrivilegedUser(user)

  const query = Soundtrack.find({ 
    movie: safeMovieId,
    $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
  })
    .populate('movie', 'title')
    .sort({ trackNumber: 1 })

  if (!privileged) {
    query.limit(PUBLIC_TRACK_LIMIT)
  }

  const tracks = await query
  return tracks.map(formatTrack)
}

const assertTrackWithinBoundary = async (track, movieId, user) => {
  if (isPrivilegedUser(user)) return

  const allowedIds = await Soundtrack.find({ 
    movie: String(movieId),
    $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
  })
    .sort({ trackNumber: 1 })
    .limit(PUBLIC_TRACK_LIMIT)
    .select('_id')
    .lean()

  const allowedSet = new Set(allowedIds.map((t) => String(t._id)))

  if (!allowedSet.has(String(track._id))) {
    throw new UnauthorizedError('This track is not available.')
  }
}

const getNextTrackLogic = async (params, user) => {
  const { currentTrackId, mode, movieId } = params

  if (!currentTrackId || !mode || !movieId) {
    throw new ValidationError('currentTrackId, mode, and movieId are required.')
  }

  const safeTrackId = String(currentTrackId)
  const safeMovieId = String(movieId)

  const currentTrack = await Soundtrack.findOne({
    _id: safeTrackId,
    movie: safeMovieId,
  }).populate('movie', 'title')

  if (!currentTrack) {
    throw new NotFoundError('Track not found in this movie context.')
  }

  await assertTrackWithinBoundary(currentTrack, safeMovieId, user)

  if (mode === 'infinite') {
    return { mode, track: formatTrack(currentTrack), restart: true }
  }

  const totalTracks = await Soundtrack.countDocuments({ 
    movie: movieId,
    $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
  })
  if (totalTracks === 1) {
    return { mode, track: formatTrack(currentTrack), restart: true }
  }

  if (mode === 'shuffle') {
    const privileged = isPrivilegedUser(user)
    const matchStage = { 
      movie: currentTrack.movie?._id ?? safeMovieId, 
      _id: { $ne: currentTrack._id },
      $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
    }

    const pipeline = privileged
      ? [{ $match: matchStage }, { $sample: { size: 1 } }]
      : [
          { $match: matchStage },
          { $sort: { trackNumber: 1 } },
          { $limit: PUBLIC_TRACK_LIMIT },
          { $sample: { size: 1 } },
        ]

    const [randomDoc] = await Soundtrack.aggregate(pipeline)

    if (!randomDoc) {
      return { mode, track: formatTrack(currentTrack), restart: true }
    }

    const randomTrack = await Soundtrack.findById(randomDoc._id).populate('movie', 'title')
    return { mode, track: formatTrack(randomTrack) }
  }

  if (mode === 'sequential') {
    let nextTrack = await Soundtrack.findOne({
      movie: movieId,
      trackNumber: { $gt: currentTrack.trackNumber },
      $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
    }).sort({ trackNumber: 1 }).populate('movie', 'title')

    if (!nextTrack) {
      nextTrack = await Soundtrack.findOne({ 
        movie: movieId,
        $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
      })
        .populate('movie', 'title')
        .sort({ trackNumber: 1 })
    }

    if (nextTrack) {
      await assertTrackWithinBoundary(nextTrack, movieId, user)
    }

    return {
      mode,
      track: formatTrack(nextTrack),
      wrapped: nextTrack.trackNumber <= currentTrack.trackNumber,
    }
  }

  throw new ValidationError('Invalid playback mode.')
}

const fetchTrackBySlug = async (slug, user) => {
  let track = await Soundtrack.findOne({ 
    slug,
    $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
  }).populate('movie', 'title')

  if (!track) {
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const titlePattern = escapedSlug.replace(/-/g, '[\\s\\-]')
    track = await Soundtrack.findOne({
      title: { $regex: new RegExp(`^${titlePattern}$`, 'i') },
      $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
    }).populate('movie', 'title')
  }

  if (!track) {
    throw new NotFoundError(`No soundtrack found with slug: ${slug}`)
  }

  if (!isPrivilegedUser(user)) {
    const ordinal = await Soundtrack.countDocuments({
      movie: track.movie?._id ?? track.movie,
      trackNumber: { $lte: track.trackNumber },
      $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
    })

    if (ordinal > PUBLIC_TRACK_LIMIT) {
      throw new NotFoundError(`No soundtrack found with slug: ${slug}`)
    }
  }

  return formatTrack(track)
}

module.exports = {
  fetchTracksByMovie,
  getNextTrackLogic,
  fetchTrackBySlug,
}
