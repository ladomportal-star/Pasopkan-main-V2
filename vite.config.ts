import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {

    plugins: [
      react(),
      tailwindcss(),
      {
        // Mounts the Backend Express app inside Vite's own dev server, so
        // `fetch('/api/...')` (see src/lib/api.ts) reaches the real API
        // instead of falling through to the SPA's index.html.
        name: 'api-server-middleware',
        async configureServer(server) {
          try {
            const { createApp } = await import('./Backend/src/app.ts');
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
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
      outDir: 'dist',
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
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
