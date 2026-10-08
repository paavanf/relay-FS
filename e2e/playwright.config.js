// playwright.config.js
// The end-to-end suite for Milestones 5 and 6. How to run it is in the root
// README, under "End-to-end tests".
//
// One worker and no retries, on purpose. The specs share one seeded
// database and are numbered so the read-only checks run before the ones that
// change data; a retry would only hide a flaky test instead of explaining it.

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  globalSetup: './stack/globalSetup.js',
  outputDir: './artifacts/test-results',

  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,

  timeout: 120_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/report', open: 'never' }],
    ['json', { outputFile: 'artifacts/results.json' }],
  ],

  use: {
    // The Microsoft Edge already on this machine, so the suite needs no
    // browser download. E2E_CHANNEL=chromium uses Playwright's own Chromium
    // instead (install it first with: npx playwright install chromium).
    channel: process.env.E2E_CHANNEL ?? 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
