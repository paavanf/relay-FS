// vitest.config.js
// Unit tests for the frontend: the plain-JavaScript helpers (such as the
// open-redirect guard in src/lib/returnPath.js), run in Node, and - since
// Milestone 9 - a few component tests (*.test.jsx) for the notification
// bell and panel, which ask for a browser-like DOM with a
// "// @vitest-environment jsdom" line at their top.
//
// Separate from vite.config.js on purpose: no Tailwind plugin is needed to
// run tests. JSX uses React's automatic runtime, as the app does.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
