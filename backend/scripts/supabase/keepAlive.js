// keepAlive.js
// The nightly workflow's keep-alive for the production Supabase project. A
// free project pauses after 7 days without database activity, and a paused
// project refuses every sign-in. Listing one user through the Admin API is
// a small request that reads the project's database.
//
// When Supabase does not answer - paused, down, or the secrets are wrong -
// it says so and returns 1: the job fails, so the run fails, and GitHub
// emails whoever owns the workflow (docs/deploy/SUPABASE.md, section 10). It
// tries a few times first, so one slow moment is not reported as an outage.
//
// `admin` is supabase-js's auth.admin (admin.js), or a stand-in in tests.
// Returns the exit code.

const RESTORE = 'If the project is paused, restore it: docs/deploy/SUPABASE.md, section 10.';

export async function keepAlive(admin, { attempts = 3, waitMs = 20_000, log = console.log } = {}) {
  if (!admin) {
    log('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to keep the Supabase project awake.');
    return 1;
  }

  let reason = 'no answer';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { error } = await admin.listUsers({ page: 1, perPage: 1 });
      if (!error) {
        log('Supabase answered: the project is awake.');
        return 0;
      }
      reason = error.status ? `${error.status} ${error.message}` : error.message;
    } catch (error) {
      reason = error.message;
    }
    log(`Attempt ${attempt} of ${attempts}: Supabase did not answer (${reason}).`);
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  log(`Supabase is unreachable. ${RESTORE}`);
  return 1;
}
