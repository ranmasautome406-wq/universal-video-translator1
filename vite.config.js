import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api requests are proxied to the backend so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
