// envGuard.js
// What vite.config.js refuses to build. Every VITE_ variable is written into
// JavaScript that anyone can download, so:
//
//   any build         no VITE_ variable named like the service role key, and
//                     none holding a secret key - sb_secret_..., or a legacy
//                     JWT whose role is service_role
//   production build  no offline test sign-in either: VITE_AUTH_MODE=test and
//                     VITE_AUTH_TEST_SECRET belong to the e2e build alone. A
//                     build is production when its mode is (a plain
//                     `vite build`) or when it runs on Vercel
//   on Vercel         the Supabase URL and publishable key, without which
//                     nobody could sign in
//
// buildEnvProblems returns sentences; vite.config.js stops on any of them.

/** A Supabase key that must never reach a browser. */
function isSecretKey(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

export function buildEnvProblems(env, { mode, onVercel }) {
  const problems = [];
  const vite = Object.entries(env).filter(([name]) => name.startsWith('VITE_'));

  for (const [name, value] of vite) {
    if (name.includes('SERVICE_ROLE')) problems.push(`${name}: a service role key never goes in the frontend`);
    else if (isSecretKey(value)) problems.push(`${name}: holds a secret key, which never goes in the frontend`);
  }

  if (mode === 'production' || onVercel) {
    if (env.VITE_AUTH_MODE === 'test') problems.push('VITE_AUTH_MODE: the offline test sign-in is for the e2e build only');
    if (env.VITE_AUTH_TEST_SECRET) problems.push('VITE_AUTH_TEST_SECRET: belongs to the e2e build only');
  }

  if (onVercel) {
    for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
      if (!env[name]) problems.push(`${name}: is required, or nobody could sign in`);
    }
  }
  return problems;
}
