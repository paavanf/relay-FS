// vitest.config.js
// Unit tests for the frontend's plain-JavaScript helpers, such as the
// open-redirect guard in src/lib/returnPath.js.
//
// Separate from vite.config.js on purpose: these tests render nothing, so
// they need neither the React nor the Tailwind plugin, and Vitest brings a
// Vite of its own to run on.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
