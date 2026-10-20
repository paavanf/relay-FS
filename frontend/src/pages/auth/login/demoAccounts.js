// demoAccounts.js
// The three shared demo accounts the login page offers when the build has
// VITE_DEMO_MODE=true, and what each one shows. The demo seed builds them
// (backend/scripts/demo/) with the same people in the same parts every week,
// and backend/tests/scripts/seedDemoAccounts.test.js proves each still shows
// what it says here. The password is public on purpose: the demo resets
// every night, and its setup is locked on the server. `page` is where each
// one lands inside the demo organisation, so its story is the first thing seen.

export const DEMO_PASSWORD = 'relay-demo-2026';

// The demo organisation's fixed id - the seed's marker (backend/src/config/demo.js),
// the same on every run - so a demo sign-in knows where it is going before it signs in.
export const DEMO_ORG_ID = '64656d6f0100000000000001';

export const DEMO_ACCOUNTS = [
  {
    email: 'owner@relay.test',
    who: 'The owner',
    page: 'schedule',
    sees: 'The whole ward: the roster grid, generating and publishing, a swap to approve, and everyone’s fairness.',
  },
  {
    email: 'jonas@relay.test',
    who: 'A worker with a swap waiting',
    page: 'swaps',
    sees: 'A swap a colleague proposed, waiting under the bell and on Swaps to be accepted or declined.',
  },
  {
    email: 'elif@relay.test',
    who: 'A worker with a direct swap',
    page: 'swaps',
    sees: 'A shift on offer that a direct swap can take, ready to propose from Swaps.',
  },
];
