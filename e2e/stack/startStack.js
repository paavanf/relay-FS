// startStack.js
// Starts everything the suite runs against, and stops it again.
//
//   1. builds the frontend (npm run build) while, at the same time,
//   2. an in-memory MongoDB replica set starts, and prepareData.js seeds it
//      with the demo ward plus the suite's own fixtures
//   3. starts the backend against it, in test mode, on a free port
//   4. serves the built frontend with npm run preview, proxying /api to it
//
// Nothing here can reach a real database. The backend is given exactly one
// connection string, the in-memory server's, and backend/.env is never read:
// the backend only loads that file when npm starts it with --env-file, and
// here node starts it directly.
//
// Whatever has started is stopped again if a later step fails, and by stop()
// at the end of the run - pass or fail. The steps themselves are in steps.js.

import crypto from 'node:crypto';
import { freePorts } from './ports.js';
import { stopTree, stopGracefully } from './processes.js';
import { DATABASE, startDatabase, buildFrontend, seedDatabase, startBackend, startPreview, writeLogs } from './steps.js';

const secret = () => crypto.randomBytes(32).toString('hex');

export async function startStack() {
  const logs = {};
  const stops = [];
  const began = Date.now();
  const timings = {};
  const mark = (phase) => (timings[phase] = Math.round((Date.now() - began) / 100) / 10);
  const stop = async () => {
    while (stops.length > 0) await stops.pop()().catch(() => {});
    writeLogs(logs);
  };

  try {
    const [database, build] = await Promise.allSettled([
      startDatabase(logs).finally(() => mark('database')),
      buildFrontend(logs).finally(() => mark('build')),
    ]);
    if (database.status === 'fulfilled') stops.push(() => stopGracefully(database.value.child));
    if (database.status === 'rejected') throw database.reason;
    if (build.status === 'rejected') throw build.reason;

    const mongoUri = database.value.uri;
    const data = await seedDatabase(mongoUri, logs);
    mark('seeded');

    const [apiPort, webPort] = await freePorts(2);
    const apiOrigin = `http://127.0.0.1:${apiPort}`;
    const webOrigin = `http://127.0.0.1:${webPort}`;

    const backend = await startBackend({ mongoUri, apiPort, webOrigin, secrets: { access: secret(), refresh: secret() } }, logs);
    stops.push(async () => stopTree(backend));
    mark('backend');

    const preview = await startPreview({ webPort, apiOrigin }, logs);
    stops.push(async () => stopTree(preview));
    mark('preview');

    // If Playwright itself dies, still take the servers down with it.
    process.once('exit', () => [preview, backend, database.value.child].forEach(stopTree));

    return { info: { baseURL: webOrigin, apiURL: apiOrigin, database: DATABASE, ...data }, timings, stop };
  } catch (err) {
    await stop();
    throw err;
  }
}
