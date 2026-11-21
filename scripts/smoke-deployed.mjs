// smoke-deployed.mjs
// A quick check of a deployed Relay, run by hand after a deploy:
//
//   Usage: node scripts/smoke-deployed.mjs <site> <supabase-url> <publishable-key>
//   e.g.   node scripts/smoke-deployed.mjs https://<project>.vercel.app https://<project-ref>.supabase.co sb_publishable_...
//
// The three are plain arguments, so the same line works in PowerShell, cmd
// and bash. The Supabase URL and publishable key are the production
// project's, and public: the built site holds them too.
//
// It talks to the site it is given - so every API call goes through
// Vercel's /api rewrite, as a browser's would - and to the Supabase project,
// to sign in as a browser does. It only reads, apart from one thing: it
// signs in once as the shared demo's owner, whose password is public
// anyway, and out again. Each check prints PASS or FAIL (or WARN, for
// something to act on that is not broken), and the script exits with 1 if
// any failed. docs/deploy/DEPLOY.md says what to do about each failure. The
// checks are in scripts/smoke/.

import { landingPage, healthThroughApi, publicConfig, securityHeaders, appRoutes } from './smoke/pageChecks.mjs';
import { demoSignIn, relayKnowsThem, refreshKeepsSession, otherOrgHidden, signsOut } from './smoke/sessionChecks.mjs';

const CHECKS = [
  ['The landing page loads', landingPage],
  ['The API answers through /api', healthThroughApi],
  ['GET /api/v1/config', publicConfig],
  ['Security headers on the page', securityHeaders],
  ['Pages open from their address', appRoutes],
  ['The demo owner can sign in with Supabase', demoSignIn],
  ['Relay knows who signed in', relayKnowsThem],
  ['A refreshed session is the same person', refreshKeepsSession],
  ["Another organisation's data stays hidden", otherOrgHidden],
  ['Signing out ends the session', signsOut],
];

const USAGE = 'Usage: node scripts/smoke-deployed.mjs <site> <supabase-url> <publishable-key>';
const [site, supabaseUrl, publishableKey] = process.argv.slice(2);
const isAddress = (value) => /^https?:\/\/[^/\s]+/.test(value ?? '');

if (!isAddress(site) || !isAddress(supabaseUrl) || !publishableKey) {
  console.error(USAGE);
  console.error('  e.g. node scripts/smoke-deployed.mjs https://<project>.vercel.app https://<project-ref>.supabase.co sb_publishable_...');
  console.error("The Supabase URL and publishable key are the production project's, and public (docs/deploy/SUPABASE.md, section 6).");
  process.exit(2);
}
if (publishableKey.startsWith('sb_secret_')) {
  console.error('That is a secret key. The smoke test needs the publishable one (sb_publishable_...), and a secret key never belongs on a command line.');
  process.exit(2);
}

const supabaseOrigin = new URL(supabaseUrl).origin;
const ctx = {
  origin: new URL(site).origin,
  supabase: { url: supabaseOrigin, origin: supabaseOrigin, key: publishableKey },
};
console.log(`Smoke test of ${ctx.origin}, signing in with ${supabaseOrigin}\n`);

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
