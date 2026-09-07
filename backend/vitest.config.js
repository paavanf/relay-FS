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
    // Each test file boots its own in-memory replica set. Running files in
    // parallel meant several forks racing to lock the shared mongod binary,
    // which fails intermittently with "Cannot unlock file ... not locked by
    // this process". One file at a time is slower but deterministic.
    fileParallelism: false,
    coverage: { reporter: ['text', 'lcov'], include: ['src/**/*.js'] },
  },
});
