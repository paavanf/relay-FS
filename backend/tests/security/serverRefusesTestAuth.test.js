// serverRefusesTestAuth.test.js
// The real server, started as Render starts it (node src/server.js), will
// not run with the offline test sign-in switched on outside the tests: it
// exits with code 1 and names the problem - before it opens a database
// connection or a port. The database address is one nothing listens on, so
// even a server that wrongly got further would reach nothing.

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTION_ENV } from '../helpers/productionEnv.js';

const BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TEST_SIGN_IN = { AUTH_MODE: 'test', AUTH_TEST_SECRET: 'x'.repeat(40) };

function startServer(env) {
  // Windows needs these to start a process at all; nothing else is inherited.
  const { PATH, Path, SystemRoot } = process.env;
  return spawnSync(process.execPath, ['src/server.js'], {
    cwd: BACKEND,
    env: { PATH, Path, SystemRoot, ...env, MONGODB_URI: 'mongodb://127.0.0.1:9/never-used' },
    encoding: 'utf8',
    timeout: 30_000,
  });
}

describe('the server and the test sign-in', () => {
  it('refuses to start in production with AUTH_MODE=test', () => {
    const result = startServer({ ...PRODUCTION_ENV, ...TEST_SIGN_IN });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('AUTH_MODE: test sign-in is only allowed when NODE_ENV=test');
  });

  it('refuses to start in development with AUTH_MODE=test', () => {
    const result = startServer({ ...PRODUCTION_ENV, NODE_ENV: 'development', ...TEST_SIGN_IN });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('AUTH_MODE: test sign-in is only allowed when NODE_ENV=test');
  });
});
