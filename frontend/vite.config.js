import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The frontend talks to the backend through the Vite dev proxy so that the
// browser sees a single origin. This keeps cookies (including the httpOnly
// auth cookie) working without any cross-site configuration during local
// development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: false,
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
