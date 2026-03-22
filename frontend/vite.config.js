import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Dev: GSI / FedCM popups use postMessage; strict COOP blocks it in some browsers.
      // Harden this in production (e.g. same-origin-allow-popups) at the reverse proxy.
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
});
