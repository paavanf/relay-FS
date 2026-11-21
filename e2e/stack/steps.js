// steps.js
// The steps startStack.js runs, one function each: the in-memory database,
// the frontend build, the seed, the backend and the preview server. Each
// server step resolves once its server answers and hands back the child
// process for the stack to stop; if the server never answers, the step stops
// it itself before failing.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { waitForPort } from './ports.js';
import { start, run, stopTree, waitForLine, isRunning } from './processes.js';
import { backendEnv, buildEnv, dataEnv, previewEnv } from './environments.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const LOGS = path.join(ROOT, 'e2e', 'artifacts', 'logs');
// The test sign-in secret the last build was made with, for E2E_SKIP_BUILD=1.
const BUILD_SECRET = path.join(ROOT, 'e2e', 'artifacts', 'build-auth-secret');

// Must end in -demo: the seed refuses any other name, whatever the server.
export const DATABASE = 'relay-e2e-demo';

/** Resolves with what `waiting` resolves to - and stops the child first if that never happens. */
async function stopIfNeverReady(child, waiting) {
  try {
    return await waiting;
  } catch (err) {
    stopTree(child);
    throw err;
  }
}

/** stack/database.js; resolves with { child, uri } once the replica set is up. */
export async function startDatabase(logs) {
  const child = start('database', process.execPath, [path.join(here, 'database.js'), DATABASE], { cwd: ROOT, env: process.env, logs });
  const uri = await stopIfNeverReady(child, waitForLine(child, logs, 'database', /^E2E_DATABASE (\S+)$/m, { timeoutMs: 90_000 }));
  return { child, uri };
}

/**
 * The e2e build (mode e2e: a production build refuses the test sign-in);
 * resolves with the test sign-in secret built into it. E2E_SKIP_BUILD=1
 * reuses the last build - and the secret it was made with.
 */
export async function buildFrontend(authSecret, logs) {
  if (process.env.E2E_SKIP_BUILD === '1') return fs.readFileSync(BUILD_SECRET, 'utf8');
  await run('build', 'npm', ['run', 'build', '-w', 'frontend', '--', '--mode', 'e2e'], { cwd: ROOT, env: buildEnv(authSecret), logs });
  fs.mkdirSync(path.dirname(BUILD_SECRET), { recursive: true });
  fs.writeFileSync(BUILD_SECRET, authSecret);
  return authSecret;
}

/** Runs prepareData.js (the demo seed and the fixtures); resolves with the ids it printed. */
export async function seedDatabase(mongoUri, logs) {
  const output = await run('data', process.execPath, [path.join(here, 'prepareData.js')], { cwd: ROOT, env: dataEnv(mongoUri), logs });
  return JSON.parse(output.match(/^E2E_DATA (.*)$/m)[1]);
}

async function waitForHealthy(apiOrigin) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const res = await fetch(`${apiOrigin}/api/health`).catch(() => null);
    if (res?.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('the backend never reported a connected database');
}

/** The backend in test mode; resolves once it reports a connected database. */
export async function startBackend({ mongoUri, apiPort, webOrigin, authSecret }, logs) {
  const env = backendEnv({ mongoUri, apiPort, webOrigin, authSecret });
  const child = start('backend', process.execPath, ['src/server.js'], { cwd: path.join(ROOT, 'backend'), env, logs });
  const ready = waitForPort(apiPort, { timeoutMs: 30_000, isDead: () => !isRunning(child) }).then(() =>
    waitForHealthy(`http://127.0.0.1:${apiPort}`),
  );
  await stopIfNeverReady(child, ready);
  return child;
}

/** npm run preview on the built frontend, proxying /api to the backend. */
export async function startPreview({ webPort, apiOrigin }, logs) {
  const args = ['run', 'preview', '-w', 'frontend', '--', '--port', String(webPort), '--strictPort', '--host', '127.0.0.1'];
  const child = start('preview', 'npm', args, { cwd: ROOT, env: previewEnv(apiOrigin), logs });
  await stopIfNeverReady(child, waitForPort(webPort, { timeoutMs: 30_000, isDead: () => !isRunning(child) }));
  return child;
}

export function writeLogs(logs) {
  fs.mkdirSync(LOGS, { recursive: true });
  for (const [name, text] of Object.entries(logs)) fs.writeFileSync(path.join(LOGS, `${name}.log`), text);
}
