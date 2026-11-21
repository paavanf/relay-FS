// api.js
// Talking to the API directly, signed in as someone: for data no single page
// shows (every published roster at once), for raw-JSON checks, and for
// refusals the grid will not even let a person attempt.
//
// Requests go straight to the local test backend the stack started - never
// anywhere else - signed in with a test token (testToken.js), as the
// browser's stand-in for Supabase signs people in.

import { request } from '@playwright/test';
import { stack } from './stack.js';
import { signTestToken } from './testToken.js';

export async function apiAs(who) {
  const http = await request.newContext({ baseURL: stack().apiURL });

  const headers = { Authorization: `Bearer ${signTestToken(who.email, stack().authSecret)}` };

  const send = async (method, path, data) => {
    const response = await http.fetch(`/api/v1${path}`, { method, headers, data });
    const text = await response.text();
    return { status: response.status(), text, body: text ? JSON.parse(text) : null };
  };

  return {
    get: (path) => send('GET', path),
    post: (path, data) => send('POST', path, data),
    dispose: () => http.dispose(),
  };
}

/** Waits until a generation job has finished, so no spec leaves one running for the next. */
export async function waitForJob(api, orgId, jobId, { timeoutMs = 90_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { body } = await api.get(`/orgs/${orgId}/jobs/${jobId}`);
    if (body.status === 'completed' || body.status === 'failed') return body;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`generation job ${jobId} did not finish within ${timeoutMs / 1000}s`);
}
