import { z } from 'zod'

export const TRACK_TYPES = ['Opening', 'Ending', 'Insert Song']
export const PLAYBACK_MODES = ['sequential', 'shuffle', 'infinite']

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const lyricsSchema = z.object({
  romaji: z.string().default(''),
  translation: z.string().default(''),
  translator: z.string().default(''),
  source: z.string().default(''),
  synced: z.array(z.unknown()).default([]),
})

// Any item that doesn't match a known shape is kept as-is (z.unknown)
// so a bad officialUrl entry never kills the entire track parse.
const officialLinkSchema = z.union([
  z.object({ label: z.string(), url: z.string() }),
  z.string(),
  z.unknown(),
])

// ─── Track response shape (from API) ─────────────────────────────────────────

export const trackSchema = z.object({
  _id: z.string().catch(''),
  slug: z.string().catch(''),
  trackNumber: z.number().int().default(0),
  title: z.string().catch('Untitled'),
  vocal: z.string().catch('').optional(),
  producer: z.string().catch('').optional(),
  // .catch(undefined) so any unrecognised type string doesn't throw
  trackType: z.enum(TRACK_TYPES).catch(undefined).optional(),
  youtubeId: z.string().optional(),
  startTime: z.number().default(0),
  endTime: z.number().optional(),
  embedUrl: z.string().catch(null).optional(),
  coverImage: z.string().nullable().catch(null).default(null),
  officialUrl: z.array(officialLinkSchema).catch([]).default([]),
  lyrics: lyricsSchema.catch({}).default({}),
  movie: z.object({ _id: z.string(), title: z.string() }).nullable().catch(null).optional(),
})

// ─── API response wrappers ────────────────────────────────────────────────────

/** GET /api/v1/wiki/soundtrack */
export const soundtrackListResponseSchema = z.union([
  // Standard format: {tracks: [...]}
  z.object({
    tracks: z.array(trackSchema),
  }),
  // Fallback: raw array (handle API response variation)
  z.array(trackSchema),
])

/** GET /api/v1/wiki/soundtrack/:slug */
export const soundtrackDetailResponseSchema = z.object({
  track: trackSchema,
})

/** GET /api/v1/wiki/soundtrack/next */
export const soundtrackNextResponseSchema = z.object({
  mode: z.enum(PLAYBACK_MODES),
  track: trackSchema,
  restart: z.boolean().optional(),
  wrapped: z.boolean().optional(),
})

// ─── Derived TypeScript-friendly types (JSDoc) ────────────────────────────────
/** @typedef {z.infer<typeof trackSchema>} Track */
/** @typedef {z.infer<typeof soundtrackListResponseSchema>} SoundtrackListResponse */
/** @typedef {z.infer<typeof soundtrackDetailResponseSchema>} SoundtrackDetailResponse */
/** @typedef {z.infer<typeof soundtrackNextResponseSchema>} SoundtrackNextResponse */
