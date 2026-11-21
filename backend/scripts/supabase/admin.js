// admin.js
// The Supabase Admin API, for the scripts that need it: the demo seed, which
// keeps the demo's sign-ins (demo/demoAccounts.js), and the nightly
// keep-alive (keepAlive.js).
//
// It is made from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY - the project's
// SECRET key (sb_secret_..., or the legacy service_role key), which can do
// anything to every account. So it is read here, by scripts run from your
// own machine or from GitHub Actions, and never by the server: a production
// server refuses to start with it in its environment (src/config/authEnv.js).
//
// Returns supabase-js's auth.admin, or null when either value is missing.

import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin(env) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  // A script, not a browser: nothing to keep between runs, nothing to refresh.
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client.auth.admin;
}
