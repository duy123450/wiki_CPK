import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import obfuscator from 'rollup-plugin-obfuscator'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        safari: 14,
      },
    },
  },

  build: {
    cssMinify: 'lightningcss',
    sourcemap: false,
    reportCompressedSize: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
      plugins: [
        process.env.NODE_ENV === 'production' && obfuscator({
          globalOptions: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 0.75,
            selfDefending: true,
          },
        }),
        // Bundle analysis: run `ANALYZE=true npm run build` to generate stats.html
        process.env.ANALYZE === 'true' && visualizer({
          open: true,
          filename: 'stats.html',
          gzipSize: true,
        }),
      ].filter(Boolean),
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
