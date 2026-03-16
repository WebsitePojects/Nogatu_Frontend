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
        name: 'portal-history-fallback',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Rewrite /portal/* paths (no file extension) to portal/index.html
            if (req.url.startsWith('/portal') && !req.url.includes('.')) {
              req.url = '/portal/index.html';
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
