import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * `npm run dev` serves the SPA *and* the real backend API from one process and
 * one port, so `fetch('/api/...')` (src/lib/api.ts) needs no proxy or CORS.
 * `DISABLE_HMR=true` turns off Hot Module Replacement (e.g. sandboxed editors).
 * Client env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) live in frontend/.env.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server-middleware',
      async configureServer(server) {
        try {
          // Loaded through Vite's SSR loader so the backend's own dependencies
          // resolve from backend/node_modules (they are not installed here).
          const { createApp } = await server.ssrLoadModule(
            path.resolve(__dirname, '../backend/src/app.ts'),
          );
          server.middlewares.use(createApp());
        } catch (e) {
          console.error('Failed to mount Backend API in Vite dev server:', e);
        }
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', 'motion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
