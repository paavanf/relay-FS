// supabase-keep-alive.js
// Keeps the production Supabase project from pausing, and fails loudly when
// it cannot be reached. The nightly workflow runs it; scripts/supabase/
// keepAlive.js says what it does and why.
//
//   npm run keep-alive
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY: from the shell (GitHub
// Actions' secrets), or else from backend/.env.

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // No .env at all; keepAlive says what is missing.
}

const { supabaseAdmin } = await import('./supabase/admin.js');
const { keepAlive } = await import('./supabase/keepAlive.js');
process.exitCode = await keepAlive(supabaseAdmin(process.env));
