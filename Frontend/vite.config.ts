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

  // Where the Vite dev server proxies /api/* requests (the Pasopkan backend).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet'],
            'vendor-ui': ['lucide-react', 'motion'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
      // HMR can be disabled via DISABLE_HMR=true (e.g. sandboxed editors).
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
