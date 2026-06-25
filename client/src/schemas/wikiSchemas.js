import { z } from 'zod'

// --- Shared Sub-schemas ---
const heroVideoSchema = z.object({
  url: z.string().catch(''),
  public_id: z.string().catch(''),
  isLooping: z.boolean().default(true),
})

const imageSchema = z.object({
  url: z.string().catch(''),
  public_id: z.string().catch(''),
})

const posterSchema = z.object({
  url: z.string().catch(''),
  public_id: z.string().catch(''),
})

const movieDetailsSchema = z.object({
  releaseDate: z.string().nullable().catch(null).optional(),
  runtime: z.string().catch('').optional(),
  studio: z.string().catch('').optional(),
  director: z.string().catch('').optional(),
  officialWebsite: z.string().catch('').optional(),
  trailerUrl: z
    .array(
      z.object({
        url: z.string().catch(''),
        label: z.string().catch(''),
      })
    )
    .catch([])
    .default([]),
  watchUrl: z.string().catch('').optional(),
  lightNovelUrl: z.string().catch('').optional(),
})

// --- Core Response Schemas ---

export const categorySchema = z.object({
  _id: z.string().catch(''),
  name: z.string().catch('Untitled Category'),
  icon: z.string().catch('file-text'),
  order: z.number().int().default(0),
  slug: z.string().catch(''),
})

export const movieSchema = z.object({
  _id: z.string().catch(''),
  title: z.string().catch('Untitled Movie'),
  tagline: z.string().catch('').optional(),
  synopsis: z.string().catch(''),
  heroVideo: z.array(heroVideoSchema).catch([]).default([]),
  poster: z.array(posterSchema).catch([]).default([]),
  details: movieDetailsSchema.catch({}),
  rating: z.number().default(0),
  slug: z.string().catch(''),
})

export const wikiPageSchema = z.object({
  _id: z.string().catch(''),
  title: z.string().catch('Untitled Page'),
  slug: z.string().catch(''),
  content: z.string().catch(''),
  category: z.union([z.string(), categorySchema]).catch(''),
  order: z.number().int().default(0),
  relatedCharacter: z.string().nullable().catch(null).optional(),
  image: imageSchema.nullable().catch(null).optional(),
  heroVideo: heroVideoSchema.nullable().catch(null).optional(),
})

// --- Form / Input Schemas ---

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  icon: z.string().optional().default('file-text'),
  order: z.number().int().optional().default(0),
  slug: z.string().trim().lowercase().optional(),
})

export const movieInputSchema = z.object({
  title: z.string().trim().min(1, 'Movie title is required'),
  tagline: z.string().trim().optional(),
  synopsis: z.string().min(1, 'Synopsis is required'),
  heroVideo: z
    .array(
      z.object({
        url: z.string().url('Invalid video URL'),
        public_id: z.string().min(1, 'public_id is required'),
        isLooping: z.boolean().default(true),
      })
    )
    .optional()
    .default([]),
  poster: z
    .array(
      z.object({
        url: z.string().url('Invalid poster URL'),
        public_id: z.string().min(1, 'public_id is required'),
      })
    )
    .optional()
    .default([]),
  details: z
    .object({
      releaseDate: z.string().or(z.date()).optional().nullable(),
      runtime: z.string().trim().optional(),
      studio: z.string().trim().optional(),
      director: z.string().trim().optional(),
      officialWebsite: z.string().url('Invalid website URL').or(z.literal('')).optional(),
      trailerUrl: z
        .array(
          z.object({
            url: z.string().url('Invalid trailer URL').or(z.literal('')).default(''),
            label: z.string().default(''),
          })
        )
        .optional()
        .default([]),
      watchUrl: z.string().url('Invalid watch URL').or(z.literal('')).optional(),
      lightNovelUrl: z.string().url('Invalid light novel URL').or(z.literal('')).optional(),
    })
    .optional(),
  rating: z.number().min(0).max(10).optional().default(0),
  slug: z.string().trim().lowercase().optional(),
})

export const wikiPageInputSchema = z.object({
  title: z.string().trim().min(1, 'Page title is required'),
  slug: z.string().trim().lowercase().optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
  order: z.number().int().optional().default(0),
  relatedCharacter: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Character ID').optional().nullable(),
  image: z
    .object({
      url: z.string().url('Invalid image URL'),
      public_id: z.string().min(1, 'public_id is required'),
    })
    .optional()
    .nullable(),
  heroVideo: z
    .object({
      url: z.string().url('Invalid video URL'),
      public_id: z.string().min(1, 'public_id is required'),
      isLooping: z.boolean().default(true),
    })
    .optional()
    .nullable(),
})

// --- TypeScript / JSDoc Type Definitions ---
/** @typedef {z.infer<typeof categorySchema>} Category */
/** @typedef {z.infer<typeof movieSchema>} Movie */
/** @typedef {z.infer<typeof wikiPageSchema>} WikiPage */
/** @typedef {z.infer<typeof categoryInputSchema>} CategoryInput */
/** @typedef {z.infer<typeof movieInputSchema>} MovieInput */
/** @typedef {z.infer<typeof wikiPageInputSchema>} WikiPageInput */
