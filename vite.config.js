import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/chart?ticker=AMZN&interval=1d&range=6mo
      '/api/chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => {
          const qs  = path.split('?')[1] ?? '';
          const p   = new URLSearchParams(qs);
          const ticker   = p.get('ticker') ?? '';
          const interval = p.get('interval') ?? '1d';
          const range    = p.get('range') ?? '6mo';
          return `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
        },
      },
      // /api/quote?symbols=AMZN,ORCL&fields=...
      '/api/quote': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => {
          const qs  = path.split('?')[1] ?? '';
          const p   = new URLSearchParams(qs);
          const symbols = p.get('symbols') ?? '';
          const fields  = p.get('fields')  ?? 'regularMarketPrice,regularMarketChangePercent';
          return `/v7/finance/quote?symbols=${symbols}&fields=${fields}`;
        },
      },
      // Congress data proxy
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
          'react-vendor':    ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
        },
      },
    },
  },
});
