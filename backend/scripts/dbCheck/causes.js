// causes.js
// Turns a failed connection into a likely cause and what to do about it, for
// check-db.js. The detail is always shown too - scrubbed (scrub.js) - since
// for an unrecognised failure it is the only clue.

import { scrub, serverErrors } from './scrub.js';

// Matched in order against the error; the first hit wins. DNS comes before
// server selection because a lookup failure can arrive wrapped inside a
// server-selection error, and the DNS problem is then the real cause.
const CAUSES = [
  {
    match: /bad auth|[Aa]uthentication failed|AuthenticationFailed|unescaped/,
    cause: 'The username or password in MONGODB_URI is wrong.',
    fix: [
      'Atlas -> Database Access -> Edit the user -> Edit Password, and set a new one.',
      'Put the new password into MONGODB_URI in backend/.env.',
      'URL-encode any special characters in it (for example @ becomes %40).',
    ],
  },
  {
    match: /querySrv|ENOTFOUND|EAI_AGAIN|getaddrinfo|ESERVFAIL/,
    cause: 'DNS or the network cannot resolve the Atlas host.',
    fix: [
      'Check that you are online.',
      'Try another network - a phone hotspot is the quickest test.',
      'Some campus and office networks block the SRV lookups that mongodb+srv:// needs.',
      'If that is it: Atlas -> Connect -> Drivers, choose an older driver version to get the standard mongodb:// string, and use that instead.',
    ],
  },
  {
    // The servers answered but refused the secure handshake. Atlas does this
    // to an address that is not on the cluster's access list, so it comes
    // before the general timeout below, which it would otherwise match too.
    match: /alert internal error|SSL alert number 80/,
    cause: 'The cluster refused this computer\'s secure connection. On Atlas that almost always means your current IP address is not on the access list; it can also happen while the cluster is still paused.',
    fix: [
      'Atlas -> Network Access -> Add IP Address -> Add Current IP Address. Your address has probably changed since you last connected.',
      'Atlas -> Database: check the cluster shows Active, not Paused or Resuming. If it shows Paused, click Resume.',
      'Wait a minute for the change to apply, then run npm run db:check again.',
    ],
  },
  {
    // Atlas pauses a free cluster after 30 days without connections. Right
    // after Resume it can take a few minutes to accept them, which looks
    // exactly like this - hence the wait as the first step.
    match: /Server selection|ServerSelection|ReplicaSetNoPrimary|whitelist|\bIP\b|timed out/,
    cause: 'The cluster is still resuming, is still paused, or your current IP address is not allowed.',
    fix: [
      'Wait 5 minutes and run npm run db:check again - a cluster that has just been resumed takes a few minutes to accept connections.',
      'Atlas -> Database: check the cluster shows Active, not Paused or Resuming. If it shows Paused, click Resume.',
      'Atlas -> Network Access -> Add IP Address -> Add Current IP Address (your address may have changed since you last connected).',
    ],
  },
];

// Everything an error can say about itself, joined for matching. Never printed
// as-is: it can contain hostnames.
function haystack(err) {
  const parts = [err?.name, err?.code, err?.codeName, err?.message, err?.cause?.message, err?.reason?.type];
  for (const server of err?.reason?.servers?.values?.() ?? []) parts.push(server?.error?.message);
  return parts.filter(Boolean).join(' | ');
}

export function printCause(err, secrets) {
  const known = CAUSES.find((c) => c.match.test(haystack(err)));

  if (known) {
    console.log(`\nLikely cause: ${known.cause}\n\nWhat to do:`);
    known.fix.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  }
  // Always shown, scrubbed: for an unrecognised failure it is the only clue,
  // and for a recognised one it confirms the diagnosis.
  const detail = scrub(`${err?.name ?? 'Error'}: ${err?.message ?? err}`, secrets);
  console.log(`\n${known ? 'Detail' : 'Error'}: ${detail}`);

  if (err?.reason?.type) console.log(`Cluster state seen: ${err.reason.type}`);
  for (const message of serverErrors(err, secrets)) console.log(`Server said: ${message}`);
}
