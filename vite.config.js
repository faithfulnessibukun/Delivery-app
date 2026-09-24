import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Set the chunk size limit in kilobytes (kB). 
    // Default is 500. Setting it to 1000 raises the warning threshold to 1 MB.
    chunkSizeWarningLimit: 1000,
  },
});