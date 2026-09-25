import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Standalone Vite SPA on port 5173. The Backend runs as its own process on
 * port 3000 (see ../Backend); the dev server proxies `/api/*` to it so
 * `fetch('/api/...')` (src/lib/api.ts) needs no CORS config.
 * `DISABLE_HMR=true` turns off Hot Module Replacement (e.g. sandboxed editors).
 * `VITE_API_PROXY_TARGET` overrides the proxy target (default http://localhost:3000).
 * Client env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) live in frontend/.env.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    port: 5173,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
