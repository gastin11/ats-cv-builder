import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Backend API target. The frontend always calls the relative path /api, so the
// same build works locally and behind a tunnel; only this proxy needs to know
// where the backend actually listens.
const API_TARGET = process.env.API_TARGET ?? 'http://127.0.0.1:4000';

// Tunnel hostnames (ngrok static domain) are allowed explicitly; the dev server
// otherwise rejects unknown Host headers.
const TUNNEL_HOSTS = ['.ngrok-free.app', '.ngrok.io'];

const apiProxy = {
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: TUNNEL_HOSTS,
    proxy: apiProxy,
    fs: {
      // allow importing the shared CV schema from outside the frontend root
      allow: [fileURLToPath(new URL('.', import.meta.url)), fileURLToPath(new URL('../shared', import.meta.url))],
    },
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: TUNNEL_HOSTS,
    proxy: apiProxy,
  },
});
