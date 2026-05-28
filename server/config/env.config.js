const { z } = require('zod')
require('dotenv').config()

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z.string().url('Invalid MONGO_URI'),
  FRONTEND_URL: z.string().url('Invalid FRONTEND_URL'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SESSION_SECRET: z
    .string()
    .min(
      process.env.NODE_ENV === 'test' ? 1 : 32,
      'SESSION_SECRET should be at least 32 characters'
    ),
  JWT_ACCESS_SECRET: z.string().min(process.env.NODE_ENV === 'test' ? 1 : 32),
  JWT_REFRESH_SECRET: z.string().min(process.env.NODE_ENV === 'test' ? 1 : 32),
  JWT_ACCESS_LIFETIME: z.string().default('15m'),
  JWT_REFRESH_LIFETIME: z.string().default('30d'),
  CLOUD_NAME: z.string(),
  API_KEY: z.string(),
  API_SECRET: z.string(),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  // Twitter/X OAuth (local)
  X_LOCAL_CLIENT_ID: z.string().optional(),
  X_LOCAL_CLIENT_SECRET: z.string().optional(),
  X_LOCAL_CALLBACK_URL: z.string().optional(),
  // Twitter/X OAuth (production)
  X_PROD_CLIENT_ID: z.string().optional(),
  X_PROD_CLIENT_SECRET: z.string().optional(),
  X_PROD_CALLBACK_URL: z.string().optional(),
  // Twitter/X OAuth (fallback)
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),
  // Discord OAuth (local)
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_LOCAL_CALLBACK_URL: z.string().optional(),
  // Discord OAuth (production)
  DISCORD_PROD_CLIENT_ID: z.string().optional(),
  DISCORD_PROD_CLIENT_SECRET: z.string().optional(),
  DISCORD_PROD_CALLBACK_URL: z.string().optional(),
  // GitHub OAuth (local)
  GITHUB_LOCAL_CLIENT_ID: z.string().optional(),
  GITHUB_LOCAL_CLIENT_SECRET: z.string().optional(),
  GITHUB_LOCAL_CALLBACK_URL: z.string().optional(),
  // GitHub OAuth (production)
  GITHUB_PROD_CLIENT_ID: z.string().optional(),
  GITHUB_PROD_CLIENT_SECRET: z.string().optional(),
  GITHUB_PROD_CALLBACK_URL: z.string().optional(),
})

const cleanedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, val]) => {
    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return [key, trimmed.slice(1, -1)]
      }
      return [key, trimmed]
    }
    return [key, val]
  })
)

const parsed = envSchema.safeParse(cleanedEnv)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

module.exports = parsed.data
