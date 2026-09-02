import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    pool: 'forks',
    coverage: { reporter: ['text', 'lcov'], include: ['src/**/*.js'] },
  },
});
