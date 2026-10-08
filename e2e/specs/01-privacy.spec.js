// 01-privacy.spec.js
// Checklist section: "Server-side privacy, on raw response JSON"
//   - a worker's /rosters response contains no drafts
//   - a worker's /fairness response contains no other member's name or id
//
// Both are read from the responses the worker's own browser receives, as raw
// text, so nothing can hide in a field the page simply does not draw.

import { test, expect } from '../support/test.js';
import { stack, appPath } from '../support/stack.js';
import { asha, manager } from '../support/people.js';
import { apiAs } from '../support/api.js';
import { reloadAndRead } from '../support/responses.js';

test('a worker is sent no draft rosters', async ({ sessions }) => {
  const { orgId, rosters, published } = stack();
  const drafts = rosters.filter((r) => r.status === 'draft');
  const { page } = await sessions.open(asha, { path: appPath('schedule') });

  // The roster picker is only drawn once the roster list has arrived.
  const text = await reloadAndRead(page, `/api/v1/orgs/${orgId}/rosters`, page.getByLabel('Choose a roster'));

  expect(drafts.length, 'the stack has drafts to hide').toBeGreaterThan(0);
  expect(JSON.parse(text).rosters.map((r) => r.id).sort()).toEqual(published.map((r) => r.id).sort());
  expect(text).not.toContain('draft');
  for (const draft of drafts) expect(text).not.toContain(draft.id);

  // Asking for a draft by its id gets the same answer as a roster that does not exist.
  const api = await apiAs(asha);
  for (const draft of drafts) {
    expect((await api.get(`/orgs/${orgId}/rosters/${draft.id}`)).status).toBe(404);
  }
  await api.dispose();
});

test("a worker's fairness response holds nobody else's name or id", async ({ sessions }) => {
  const { orgId } = stack();
  const api = await apiAs(manager);
  const { members } = (await api.get(`/orgs/${orgId}/members`)).body;
  await api.dispose();
  const others = members.filter((m) => m.email !== asha.email);
  expect(others).toHaveLength(13);

  const { page } = await sessions.open(asha, { path: appPath('fairness') });
  const ready = page.getByRole('heading', { name: 'Your shifts in this period' });
  const text = await reloadAndRead(page, `/api/v1/orgs/${orgId}/fairness`, ready);
  const body = JSON.parse(text);

  expect(body.view).toBe('self');
  expect(body).not.toHaveProperty('rows');
  for (const other of others) {
    expect(text, `${other.name}'s name`).not.toContain(other.name);
    expect(text, `${other.name}'s membership id`).not.toContain(other.id);
    expect(text, `${other.name}'s user id`).not.toContain(other.userId);
  }
});
