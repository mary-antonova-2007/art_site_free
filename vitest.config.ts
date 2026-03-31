import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/web/tests/**/*.spec.ts', 'apps/web/tests/**/*.test.ts'],
    exclude: ['apps/web/tests/e2e/**'],
    setupFiles: ['apps/web/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@tests': path.resolve(__dirname, 'apps/web/tests'),
    },
  },
});
