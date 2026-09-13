import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * The frontend runs with no .env file — every option below has a working
 * default. To override, create `Frontend/.env` with any of:
 *   VITE_API_PROXY_TARGET   dev-server proxy target for /api/*  (default http://localhost:3000)
 *   GEMINI_API_KEY          inlined at build time as process.env.GEMINI_API_KEY
 *   DISABLE_HMR=true        turn off Hot Module Replacement
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server-middleware',
        async configureServer(server) {
          try {
            const { createApp } = await import('../Backend/src/app.ts');
            const app = createApp();
            server.middlewares.use(app);
          } catch (e) {
            console.error('Failed to mount Backend API in Vite dev server:', e);
          }
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: path.resolve(__dirname, '../dist'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet'],
            'vendor-ui': ['lucide-react', 'motion'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR can be disabled via DISABLE_HMR=true (e.g. sandboxed editors).
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
