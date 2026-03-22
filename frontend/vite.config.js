import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Lets Google Sign-In popup communicate with the opener (avoids COOP postMessage warnings).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
