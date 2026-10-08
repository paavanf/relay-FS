// guards.js
// The checks between this script and a database that matters.
//
// The seed deletes and recreates data, so it runs only when BOTH hold:
//   the database named in MONGODB_URI ends in "-demo" (relay-demo, say)
//   the command line says --yes
// The first stops it ever touching relay-dev or a production database; the
// second stops it running because someone pressed up-arrow and Enter.
//
// The connection string itself is never printed. Only the database name
// leaves this file, and scrub() blanks the credentials and hosts out of any
// error message before it is shown.

// A plain database name ending in -demo. Anything stranger means the string
// was not parsed the way it looks, and that alone is a reason to stop.
const DEMO_DATABASE = /^[\w-]+-demo$/;

/** The database named in a mongodb:// or mongodb+srv:// string, or null. */
export function databaseNameOf(uri) {
  return uri?.match(/^[^/]+\/\/[^/]+\/([^?]+)/)?.[1] ?? null;
}

/** Why the seed must not run, or null when it may. */
export function refusalFor({ uri, database, argv }) {
  if (!uri) {
    return 'MONGODB_URI is not set. Point it at your demo database (ending in /relay-demo) in backend/.env or your shell.';
  }
  if (!database) {
    return 'MONGODB_URI names no database, so MongoDB would use "test". Add /relay-demo before the "?" and run again.';
  }
  if (!DEMO_DATABASE.test(database)) {
    return [
      `Refusing to seed "${database}": the database name must end in "-demo", for example relay-demo.`,
      'This script deletes and recreates data, so it only ever runs against a database kept for the demo.',
    ].join('\n');
  }
  if (!argv.includes('--yes')) {
    return [
      `This replaces the demo ward in "${database}". Nothing outside the demo ward is touched.`,
      'Run it again with --yes to go ahead:  npm run seed:demo -- --yes',
    ].join('\n');
  }
  return null;
}

function decoded(part) {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** message, with the connection string's user, password and hosts blanked out. */
export function scrub(message, uri = '') {
  const authority = uri.split('://')[1]?.split('/')[0] ?? '';
  const secrets = authority
    .split(/[@,:]/)
    .flatMap((part) => [part, decoded(part)])
    .filter((part) => part.length >= 4);

  return secrets.reduce((text, part) => text.replaceAll(part, '[hidden]'), String(message));
}
