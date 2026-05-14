const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().url('Invalid MONGO_URI'),
  FRONTEND_URL: z.string().url('Invalid FRONTEND_URL'),
  SESSION_SECRET: z.string().min(process.env.NODE_ENV === 'test' ? 1 : 32, 'SESSION_SECRET should be at least 32 characters'),
  JWT_ACCESS_SECRET: z.string().min(process.env.NODE_ENV === 'test' ? 1 : 32),
  JWT_REFRESH_SECRET: z.string().min(process.env.NODE_ENV === 'test' ? 1 : 32),
  JWT_ACCESS_LIFETIME: z.string().default('15m'),
  JWT_REFRESH_LIFETIME: z.string().default('30d'),
  CLOUD_NAME: z.string(),
  API_KEY: z.string(),
  API_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  X_LOCAL_CLIENT_ID: z.string().optional(),
  X_LOCAL_CLIENT_SECRET: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
