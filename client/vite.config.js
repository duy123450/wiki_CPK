import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      /** * Use '@' to represent your 'src' directory.
       * This speeds up the 'rolldown:vite-resolve' process by avoiding 
       * deep relative paths like ../../../components.
       */
      '@': path.resolve(__dirname, './src'),
    },
  },

  css: {
    /** * Switching to Lightning CSS (written in Rust) solves the 53% build time 
     * spent in 'vite:css'. It is much faster than standard PostCSS.
     */
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        // Broad browser support
        safari: 14,
        edge: 90,
        chrome: 90,
        firefox: 90,
      },
    }
  },

  build: {
    /** * Uses Lightning CSS for minification, further speeding up the build.
     * Note: Ensure you have run 'npm install -D lightningcss'
     */
    cssMinify: 'lightningcss',
    
    // Disabling sourcemaps speeds up build time and reduces file size
    sourcemap: false,
    
    rollupOptions: {
      output: {
        // Groups major libraries into a separate vendor chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
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