import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Proxy Yahoo Finance API calls to avoid CORS in development
  server: {
    proxy: {
      '/api/yf': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/yf/, ''),
      },
      '/api/congress-data': {
        target: 'https://house-stock-watcher-data.s3-us-east-2.amazonaws.com',
        changeOrigin: true,
        rewrite: () => '/data/all_transactions.json',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
        },
      },
    },
  },
});
