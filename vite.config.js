import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [
      react(),
      {
        name: 'spa-history-fallback',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Portal SPA fallback
            if (req.url.startsWith('/portal') && !req.url.includes('.')) {
              req.url = '/portal/index.html';
            }
            // Landing SPA fallback - non-file requests to landing pages
            else if (
              !req.url.startsWith('/portal') &&
              !req.url.startsWith('/api') &&
              !req.url.startsWith('/src') &&
              !req.url.startsWith('/node_modules') &&
              !req.url.startsWith('/@') &&
              !req.url.includes('.') &&
              req.url !== '/'
            ) {
              req.url = '/index.html';
            }
            next();
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          landing: resolve(__dirname, 'index.html'),
          portal: resolve(__dirname, 'portal/index.html'),
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
