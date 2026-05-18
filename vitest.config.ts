import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts', 'apps/web/tests/**/*.spec.ts', 'apps/web/tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'apps/web/tests/e2e/**'],
    setupFiles: [path.resolve(__dirname, 'apps/web/tests/setup.ts')],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
      '@tests': path.resolve(__dirname, 'apps/web/tests'),
    },
  },
});
