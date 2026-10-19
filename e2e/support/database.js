// database.js
// The suite's one direct write to the in-memory test database: moving a
// proposed swap's deadline into the past, so the expiry path runs now
// instead of in a week. Done by stack/expireChain.js in a child process,
// against the local server the stack started - never anywhere else.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stack } from './stack.js';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'stack', 'expireChain.js');

export function expireChainNow(chainId) {
  const output = execFileSync(process.execPath, [SCRIPT, chainId], {
    env: { ...process.env, NODE_ENV: 'test', MONGODB_URI: stack().databaseUri },
    encoding: 'utf8',
  });
  if (!/^E2E_EXPIRED 1$/m.test(output)) throw new Error(`Could not expire swap ${chainId}: ${output}`);
}
