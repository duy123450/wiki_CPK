import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.js'],
      include: ['src/tests/**/*.test.{js,jsx}'],
      css: false,
      pool: 'threads',
      poolOptions: {
        threads: {
          // Unbounded parallelism exhausts the thread pool on heavy jsdom suites.
          // Cap at 4 to prevent "Timeout waiting for worker to respond" errors.
          maxThreads: 4,
          minThreads: 1,
        },
      },
      testTimeout: 30000,
    },
  })
)
