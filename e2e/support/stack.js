// stack.js
// What globalSetup started, for the specs: where the app and the API are, and
// the ids of the seeded and fixture data.
//
// Read lazily, inside tests: Playwright loads the spec files to list the
// tests before globalSetup has run, so nothing here may run at import time.

let cached;

export function stack() {
  if (cached) return cached;
  const raw = process.env.E2E_STACK;
  if (!raw) throw new Error('E2E_STACK is not set. Run the suite with npm run e2e, which starts the stack first.');

  const info = JSON.parse(raw);
  cached = {
    ...info,
    published: info.rosters.filter((r) => r.status === 'published'),
    // The seed's two-week draft: the one draft that is not the fixture with holes.
    draft: info.rosters.find((r) => r.status === 'draft' && r.id !== info.holesRosterId),
    holes: info.rosters.find((r) => r.id === info.holesRosterId),
  };
  return cached;
}

/** A page of the demo ward, e.g. appPath('fairness'). */
export function appPath(page, orgId = stack().orgId) {
  return `/app/${orgId}/${page}`;
}
