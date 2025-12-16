import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.property.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    testTimeout: 30000, // Longer timeout for property-based tests
  },
});
