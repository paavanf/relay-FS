// cleanup-legacy-auth.js
// After the move to Supabase Auth, removes what the old sign-in left in the
// database: password hashes and lockout counters on users, and the old
// session and reset-link collections (scripts/cleanup/legacyAuth.js lists
// them). Run it once everyone has signed up again (docs/deploy/SUPABASE.md,
// section 9).
//
//   npm run cleanup:legacy-auth            shows what it would remove
//   npm run cleanup:legacy-auth -- --yes   removes it
//
// It reads MONGODB_URI from the shell or backend/.env, and changes nothing
// without --yes.

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // No .env at all; runCleanup says what is missing.
}

const { runCleanup } = await import('./cleanup/runCleanup.js');
process.exitCode = await runCleanup(process.argv.slice(2), process.env);
