// keepAlive.test.js
// The nightly keep-alive (scripts/supabase/keepAlive.js), against a stand-in
// for the Admin API: one small request when Supabase answers; a few tries,
// then exit code 1 and how to restore the project, when it does not - so
// the nightly run fails and GitHub says so.

import { describe, it, expect, vi } from 'vitest';
import { keepAlive } from '../../scripts/supabase/keepAlive.js';

const answering = () => ({ listUsers: vi.fn(async () => ({ data: { users: [] }, error: null })) });
const run = (admin) => {
  const lines = [];
  return keepAlive(admin, { waitMs: 0, log: (line) => lines.push(line) }).then((code) => ({ code, lines }));
};

describe('the Supabase keep-alive', () => {
  it('asks for one user, and passes when Supabase answers', async () => {
    const admin = answering();
    expect((await run(admin)).code).toBe(0);
    expect(admin.listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1 });
  });

  it('tries again, and passes when a later try is answered', async () => {
    const admin = answering();
    admin.listUsers.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect((await run(admin)).code).toBe(0);
    expect(admin.listUsers).toHaveBeenCalledTimes(2);
  });

  it('fails, saying how to restore the project, when Supabase never answers', async () => {
    const admin = { listUsers: vi.fn(async () => ({ data: null, error: { status: 503, message: 'Service Unavailable' } })) };
    const { code, lines } = await run(admin);

    expect(code).toBe(1);
    expect(admin.listUsers).toHaveBeenCalledTimes(3);
    expect(lines).toContain('Attempt 3 of 3: Supabase did not answer (503 Service Unavailable).');
    expect(lines.at(-1)).toBe('Supabase is unreachable. If the project is paused, restore it: docs/deploy/SUPABASE.md, section 10.');
  });

  it('fails when the secrets are not set', async () => {
    expect((await run(null)).code).toBe(1);
  });
});
