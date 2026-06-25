const { z } = require('zod')

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')

// --- Category Schemas ---
const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }).trim().min(1, 'Category name cannot be empty'),
    icon: z.string().optional(),
    order: z.number().int().optional(),
    slug: z.string().trim().lowercase().optional(),
  }),
})

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Category name cannot be empty').optional(),
    icon: z.string().optional(),
    order: z.number().int().optional(),
    slug: z.string().trim().lowercase().optional(),
  }),
})

// --- Movie Schemas ---
const createMovieSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Movie title is required' }).trim().min(1, 'Movie title cannot be empty'),
    tagline: z.string().trim().optional(),
    synopsis: z.string({ required_error: 'Synopsis is required' }).min(1, 'Synopsis cannot be empty'),
    heroVideo: z
      .array(
        z.object({
          url: z.string().url('Invalid video URL'),
          public_id: z.string().min(1, 'public_id is required'),
          isLooping: z.boolean().default(true),
        })
      )
      .optional(),
    poster: z
      .array(
        z.object({
          url: z.string().url('Invalid poster URL'),
          public_id: z.string().min(1, 'public_id is required'),
        })
      )
      .optional(),
    details: z
      .object({
        releaseDate: z
          .string()
          .datetime({ message: 'Invalid release date format' })
          .or(z.date())
          .optional()
          .nullable(),
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
          .optional(),
        watchUrl: z.string().url('Invalid watch URL').or(z.literal('')).optional(),
        lightNovelUrl: z.string().url('Invalid light novel URL').or(z.literal('')).optional(),
      })
      .optional(),
    rating: z.number().min(0).max(10).default(0).optional(),
    slug: z.string().trim().lowercase().optional(),
  }),
})

const updateMovieSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Movie title cannot be empty').optional(),
    tagline: z.string().trim().optional(),
    synopsis: z.string().min(1, 'Synopsis cannot be empty').optional(),
    heroVideo: z
      .array(
        z.object({
          url: z.string().url('Invalid video URL'),
          public_id: z.string().min(1, 'public_id is required'),
          isLooping: z.boolean().default(true),
        })
      )
      .optional(),
    poster: z
      .array(
        z.object({
          url: z.string().url('Invalid poster URL'),
          public_id: z.string().min(1, 'public_id is required'),
        })
      )
      .optional(),
    details: z
      .object({
        releaseDate: z
          .string()
          .datetime({ message: 'Invalid release date format' })
          .or(z.date())
          .optional()
          .nullable(),
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
          .optional(),
        watchUrl: z.string().url('Invalid watch URL').or(z.literal('')).optional(),
        lightNovelUrl: z.string().url('Invalid light novel URL').or(z.literal('')).optional(),
      })
      .optional(),
    rating: z.number().min(0).max(10).optional(),
    slug: z.string().trim().lowercase().optional(),
  }),
})

// --- WikiPage Schemas ---
const createWikiPageSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'WikiPage title is required' }).trim().min(1, 'WikiPage title cannot be empty'),
    slug: z.string().trim().lowercase().optional(),
    content: z.string({ required_error: 'Content is required' }).min(1, 'Content cannot be empty'),
    category: objectIdSchema,
    order: z.number().int().optional(),
    relatedCharacter: objectIdSchema.optional().nullable(),
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
  }),
})

const updateWikiPageSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'WikiPage title cannot be empty').optional(),
    slug: z.string().trim().lowercase().optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
    category: objectIdSchema.optional(),
    order: z.number().int().optional(),
    relatedCharacter: objectIdSchema.optional().nullable(),
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
  }),
})

const wikiSlugParamSchema = z.object({
  params: z.object({
    slug: z.string({ required_error: 'slug parameter is required' }).trim().min(1, 'slug cannot be empty'),
  }),
})

const wikiIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
})

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createMovieSchema,
  updateMovieSchema,
  createWikiPageSchema,
  updateWikiPageSchema,
  wikiSlugParamSchema,
  wikiIdParamSchema,
}
