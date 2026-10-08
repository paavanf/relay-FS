// 07-polling.spec.js
// Checklist section: "Polling stops" - count /jobs/ requests, and assert they
// stop once the job completes, and stop after navigating away in the middle
// of a generation.
//
// "Stopped" is shown by watching the page for three of its polling intervals
// after the moment polling should have ended: any /jobs/ request in that
// window fails the test. That wait is the measurement itself - absence can
// only be observed over time - not padding around a race.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { showRoster } from '../support/schedule.js';
import { apiAs, waitForJob } from '../support/api.js';
import { recordNumbers } from '../support/artifacts.js';

// frontend/src/pages/schedule/generation/useGenerationJob.js polls this often.
const POLL_MS = 1500;
const QUIET_WINDOW_MS = 3 * POLL_MS;

const isJobPoll = (request, orgId) =>
  request.method() === 'GET' && new URL(request.url()).pathname.startsWith(`/api/v1/orgs/${orgId}/jobs/`);

/** Clicks Generate (confirming the replace) and resolves with the new job's id. */
async function startGeneration(page) {
  const started = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/generate'));
  await page.getByRole('button', { name: 'Generate roster' }).click();
  // The draft already has shifts, so the app asks before replacing them.
  await page.getByRole('button', { name: 'Replace and generate' }).click();
  return (await (await started).json()).jobId;
}

test('polling stops once the job has completed', async ({ sessions }, testInfo) => {
  const { orgId, draft } = stack();
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);

  const polls = [];
  page.on('request', (request) => isJobPoll(request, orgId) && polls.push(Date.now()));

  await startGeneration(page);
  await expect(page.getByText(/^(Every shift is covered - \d+ filled|\d+ of \d+ shifts filled)/)).toBeVisible({ timeout: 90_000 });
  const atCompletion = polls.length;

  await page.waitForTimeout(QUIET_WINDOW_MS);
  recordNumbers(testInfo, 'polling-completed', { pollsUntilCompleted: atCompletion, pollsAfterwards: polls.length - atCompletion });

  expect(atCompletion, 'the page polled while the job ran').toBeGreaterThan(0);
  expect(polls.length - atCompletion, `/jobs/ requests in the ${QUIET_WINDOW_MS}ms after completion`).toBe(0);
});

test('polling stops when the manager leaves in the middle of a generation', async ({ sessions }, testInfo) => {
  const { orgId, draft } = stack();
  const { page } = await sessions.open(manager, { path: appPath('schedule') });
  await showRoster(page, draft);

  const polls = [];
  page.on('request', (request) => isJobPoll(request, orgId) && polls.push(Date.now()));
  const firstPoll = page.waitForResponse((r) => isJobPoll(r.request(), orgId));

  const jobId = await startGeneration(page);
  const job = await (await firstPoll).json();
  // Leaving after the job has finished would prove nothing.
  expect(['queued', 'running'], 'the job is still running when the manager leaves').toContain(job.status);

  await page.getByRole('link', { name: 'My shifts' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'My shifts' })).toBeVisible();
  const atLeaving = polls.length;

  await page.waitForTimeout(QUIET_WINDOW_MS);
  recordNumbers(testInfo, 'polling-left-early', { pollsBeforeLeaving: atLeaving, pollsAfterLeaving: polls.length - atLeaving, statusWhenLeaving: job.status });
  expect(polls.length - atLeaving, `/jobs/ requests in the ${QUIET_WINDOW_MS}ms after leaving`).toBe(0);

  // The server finishes the job on its own; wait for it, so no later spec starts while one is running.
  const api = await apiAs(manager);
  expect((await waitForJob(api, orgId, jobId)).status).toBe('completed');
  await api.dispose();
});
