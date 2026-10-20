// Vite config. Sets up React, Tailwind v4, the "@" import alias, and proxies
// /api calls to the backend so the frontend can use relative URLs.
//
// `vite preview` also sends the security headers Vercel adds in production
// (vercel.json), so the built app - and the end-to-end suite, which runs on
// it - meets the real Content-Security-Policy before any deploy does. The dev
// server does not send them: its hot reload needs inline scripts.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const vercel = JSON.parse(readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8'));
const pageHeaders = vercel.headers.find((rule) => rule.source === '/(.*)').headers;

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
      // The backend listens on 4917 (see backend/src/config/env.js).
      // VITE_API_PROXY overrides it, which is handy for pointing the dev
      // server at a backend running on another port.
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4917',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: Object.fromEntries(pageHeaders.map((header) => [header.key, header.value])),
  },
});
