const { z } = require('zod')

const TRACK_TYPES = ['Opening', 'Ending', 'Insert Song']
const PLAYBACK_MODES = ['sequential', 'shuffle', 'infinite']

/** GET /soundtrack?movieId=<id> */
const soundtrackListQuerySchema = z.object({
  query: z.object({
    movieId: z.string().min(1, 'movieId is required'),
  }),
})

/** GET /soundtrack/next?currentTrackId=<id>&mode=<mode>&movieId=<id> */
const soundtrackNextQuerySchema = z.object({
  query: z.object({
    currentTrackId: z.string().min(1, 'currentTrackId is required'),
    mode: z.enum(PLAYBACK_MODES, {
      errorMap: () => ({ message: `mode must be one of: ${PLAYBACK_MODES.join(', ')}` }),
    }),
    movieId: z.string().min(1, 'movieId is required'),
  }),
})

/** GET /soundtrack/:slug */
const soundtrackSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'slug is required'),
  }),
})

module.exports = {
  soundtrackListQuerySchema,
  soundtrackNextQuerySchema,
  soundtrackSlugParamSchema,
  TRACK_TYPES,
  PLAYBACK_MODES,
}
