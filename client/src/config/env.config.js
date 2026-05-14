import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('Invalid VITE_API_BASE_URL'),
  VITE_AUTH_TOKEN_KEY: z.string().default('cpkAuthToken'),
  VITE_DRAGON_ENABLED_KEY: z.string().default('cpkDragonCursorEnabled'),
  VITE_OPEN_CATEGORY_COOKIE: z.string().default('cpkSidebarOpenCategory'),
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('❌ Invalid Vite environment variables:', parsed.error.format());
  // In frontend, we might not want to crash the whole app, but at least we log it.
  // For critical ones, we could throw an error.
}

export const envConfig = parsed.success ? parsed.data : import.meta.env;
