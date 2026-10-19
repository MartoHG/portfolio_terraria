import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // Two pages: the classic portfolio at / and the Terraria world at /mundo/,
    // so PixiJS and the world assets only download once someone enters.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mundo: resolve(import.meta.dirname, 'mundo/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
