// check-db.js
// A read-only connectivity check for the MongoDB that backend/.env points at.
//
// THIS SCRIPT NEVER WRITES ANYTHING. It connects, runs `ping` and `hello`,
// lists the collections with an estimated document count, and disconnects.
// It never inserts, updates or deletes, and it cannot create a collection or
// an index by accident either: no models are imported, and Mongoose's
// autoIndex and autoCreate are switched off. (The app connects with autoIndex
// ON in development, which is why this does not reuse connectDb().)
//
// It never prints the connection string. The credentials and hosts taken from
// it are scrubbed out of any error message before that message is shown.
//
//   npm run db:check                 exit code 0 = reachable, 1 = not
//   npm run db:check -- relay-demo   also lists another database on the same
//                                    cluster, over the same read-only connection

import mongoose from 'mongoose';

// The same timeout the app uses (src/config/db.js), so this fails exactly as
// fast as the app would instead of hanging.
const TIMEOUT_MS = 10_000;

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

const line = (label, value) => console.log(`  ${label.padEnd(18)} ${value}`);

// Everything an error can say about itself, joined for matching. Never printed
// as-is: it can contain hostnames.
function haystack(err) {
  const parts = [err?.name, err?.code, err?.codeName, err?.message, err?.cause?.message, err?.reason?.type];
  for (const server of err?.reason?.servers?.values?.() ?? []) parts.push(server?.error?.message);
  return parts.filter(Boolean).join(' | ');
}

// What each server in the cluster said when it could not be reached, once
// per distinct message, scrubbed. "Timed out" from every server reads
// differently from a connection that was closed, which helps tell a paused
// cluster from a blocked address.
function serverErrors(err, secrets) {
  const messages = [...(err?.reason?.servers?.values?.() ?? [])].map((s) => s?.error?.message).filter(Boolean);
  return [...new Set(messages.map((message) => scrub(message, secrets)))];
}

// The pieces of the connection string that must never reach the screen, in
// both their URL-encoded and decoded forms, longest first.
function secretPartsOf(uri) {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/(?:([^:@/]*)(?::([^@/]*))?@)?([^/?]+)/i);
  if (!m) return [];

  const [, user, pass, hosts] = m;
  const parts = [user, pass, ...hosts.split(',').map((host) => host.split(':')[0])];
  for (const piece of [user, pass]) {
    try {
      if (piece) parts.push(decodeURIComponent(piece));
    } catch {
      // Not valid percent-encoding; the raw form is already in the list.
    }
  }
  return [...new Set(parts.filter(Boolean))].sort((a, b) => b.length - a.length);
}

function scrub(text, secrets) {
  let out = String(text)
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '<connection string>')
    .replace(/[\w.-]+\.mongodb\.net(?::\d+)?/gi, '<atlas host>')
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, '<address>');
  for (const secret of secrets) out = out.split(secret).join('<redacted>');
  return out;
}

function describeTopology(hello) {
  if (hello.setName) {
    const members = hello.hosts?.length ?? 0;
    return `yes, ${members} ${members === 1 ? 'member' : 'members'} - transactions will work`;
  }
  if (hello.msg === 'isdbgrid') return 'no, a sharded cluster (mongos) - transactions will work';
  return 'NO, a standalone server - organisation creation and availability saves will fail';
}

async function listCollections(db) {
  const infos = await db.listCollections({}, { nameOnly: true, authorizedCollections: true }).toArray();
  const names = infos
    .filter((info) => info.type !== 'view' && !info.name.startsWith('system.'))
    .map((info) => info.name)
    .sort();

  const rows = [];
  for (const name of names) {
    // estimatedDocumentCount reads collection metadata: fast, and read-only.
    rows.push([name, await db.collection(name).estimatedDocumentCount()]);
  }
  return rows;
}

function printCollections(database, rows) {
  line('Database', database);
  line('Collections', rows.length === 0 ? '0 - empty, or not created yet' : String(rows.length));

  const width = Math.max(0, ...rows.map(([name]) => name.length));
  if (rows.length > 0) console.log('');
  for (const [name, count] of rows) console.log(`    ${name.padEnd(width)}  ${String(count).padStart(7)}`);
}

function printCause(err, secrets) {
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

async function main() {
  console.log('Relay database check (read-only)\n');

  // Load backend/.env the way the app does: Node's built-in parser, the same
  // one behind `--env-file-if-exists=.env`, with the same rule - a variable
  // already set in your shell wins over the file.
  const fromShell = process.env.MONGODB_URI !== undefined;
  try {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  } catch {
    // No .env at all, like the -if-exists flag. Reported just below.
  }

  // The app quietly falls back to a local database when this is missing in
  // development. Here that would mislead - "cannot reach 127.0.0.1" says
  // nothing about Atlas - so stop and say what is actually wrong.
  if (!process.env.MONGODB_URI?.trim()) {
    line('Connection string', 'NOT SET');
    console.log('\nLikely cause: MONGODB_URI is missing from backend/.env.\n\nWhat to do:');
    console.log('  1. Copy backend/.env.example to backend/.env if it does not exist.');
    console.log('  2. Atlas -> Connect -> Drivers, copy the string into MONGODB_URI,');
    console.log('     with the database name (/relay-dev) before the "?".');
    return 1;
  }

  // Read through the app's own config module, so the value is validated
  // exactly the way the app validates it.
  const { env } = await import('../src/config/env.js');
  const uri = env.MONGODB_URI;
  const secrets = secretPartsOf(uri);
  const database = uri.match(/^[^/]+\/\/[^/]+\/([^?]+)/)?.[1] ?? 'none - would default to "test"';

  line('Connection string', `present, ${uri.split('://')[0]}://, database "${database}"`);
  if (fromShell) line('', 'taken from your shell environment, which overrides backend/.env');

  const startedAt = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: TIMEOUT_MS, autoIndex: false, autoCreate: false });
    line('Connected', `yes, in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

    const db = mongoose.connection.db;
    await db.command({ ping: 1 });
    line('Ping', 'ok');
    line('Replica set', describeTopology(await db.command({ hello: 1 })));

    printCollections(mongoose.connection.name, await listCollections(db));

    // Any other database named on the command line, e.g. relay-demo.
    for (const name of process.argv.slice(2).filter((arg) => /^[\w-]+$/.test(arg))) {
      console.log('');
      printCollections(name, await listCollections(mongoose.connection.client.db(name)));
    }

    console.log('\nThe database is reachable.');
    return 0;
  } catch (err) {
    if (mongoose.connection.readyState === 1) {
      line('Connected', 'yes, but reading the database failed');
    } else {
      line('Connected', `NO - failed after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    }
    printCause(err, secrets);
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

process.exitCode = await main();
