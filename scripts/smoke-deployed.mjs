// smoke-deployed.mjs
// A quick check of a deployed Relay, run by hand after a deploy:
//
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
//     node scripts/smoke-deployed.mjs https://your-project.vercel.app
//
// It talks to the address it is given - the frontend - so every API call
// goes through Vercel's /api rewrite, as a browser's would; and to the
// production Supabase project, to sign in as a browser does. It only reads,
// apart from one thing: it signs in once as the shared demo's owner, whose
// password the login page shows anyway, and out again. Each check prints
// PASS or FAIL (or WARN, for something to act on that is not broken), and
// the script exits with 1 if any failed. docs/deploy/DEPLOY.md says what to
// do about each failure. The checks are in scripts/smoke/.

import { landingPage, healthThroughApi, publicConfig, securityHeaders, appRoutes } from './smoke/pageChecks.mjs';
import { demoSignIn, relayKnowsThem, refreshKeepsSession, otherOrgHidden, signsOut } from './smoke/sessionChecks.mjs';

const CHECKS = [
  ['The landing page loads', landingPage],
  ['The API answers through /api', healthThroughApi],
  ['GET /api/v1/config', publicConfig],
  ['Security headers on the page', securityHeaders],
  ['App routes are served by the app', appRoutes],
  ['The demo owner can sign in with Supabase', demoSignIn],
  ['Relay knows who signed in', relayKnowsThem],
  ['A refreshed session is the same person', refreshKeepsSession],
  ["Another organisation's data stays hidden", otherOrgHidden],
  ['Signing out ends the session', signsOut],
];

const target = process.argv[2];
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
if (!/^https?:\/\/[^/]+/.test(target ?? '') || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... node scripts/smoke-deployed.mjs https://your-project.vercel.app');
  console.error('Both are the production Supabase project\'s, and public (docs/deploy/SUPABASE.md, section 6).');
  process.exit(2);
}

const supabaseUrl = new URL(SUPABASE_URL);
const ctx = {
  origin: new URL(target).origin,
  supabase: { url: supabaseUrl.origin, origin: supabaseUrl.origin, key: SUPABASE_PUBLISHABLE_KEY },
};
console.log(`Smoke test of ${ctx.origin}\n`);

let failed = 0;
for (const [name, check] of CHECKS) {
  let result;
  try {
    result = await check(ctx);
  } catch (err) {
    result = { ok: false, detail: err.name === 'TimeoutError' ? 'no answer in time' : err.message };
  }
  const label = !result.ok ? 'FAIL' : result.warn ? 'WARN' : 'PASS';
  if (!result.ok) failed += 1;
  console.log(`${label}  ${name.padEnd(42)} ${result.warn ?? result.detail ?? ''}`);
}

console.log(failed ? `\n${failed} of ${CHECKS.length} checks failed.` : `\nAll ${CHECKS.length} checks passed.`);
process.exitCode = failed ? 1 : 0;
