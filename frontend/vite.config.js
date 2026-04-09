import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // GSI popups need postMessage back; allow cross-origin opener for popup flow.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
