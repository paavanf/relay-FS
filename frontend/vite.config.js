// Vite config. Sets up React, Tailwind v4, the "@" import alias, and proxies
// /api calls to the backend so the frontend can use relative URLs.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The backend listens on 4000 (see backend/src/config/env.js).
      // VITE_API_PROXY overrides it, which is handy for pointing the dev
      // server at a backend running on another port.
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
