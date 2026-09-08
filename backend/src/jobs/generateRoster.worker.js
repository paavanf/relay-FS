// generateRoster.worker.js
// Runs roster generation off the main thread.
//
// Generation is CPU-bound for tens of seconds. Node runs JavaScript on one
// thread, so doing this inline would block every other request on the
// instance - health checks, logins, everything. On a single-instance free
// tier the whole app would look dead until it finished.
//
// This file imports ONLY the engine. No models, no database, no config: the
// parent passes a plain payload in and gets plain data back, which is exactly
// what the engine's purity was for.

import { parentPort, workerData } from 'worker_threads';

import { generateRoster } from '../engine/index.js';

function post(message) {
  parentPort?.postMessage(message);
}

try {
  const result = generateRoster({
    ...workerData,
    // The clock is injected rather than read inside the engine. Here at the
    // edge, reading it is fine.
    now: Date.now,
    onProgress: (percent, metrics) => post({ type: 'progress', percent, metrics }),
  });

  post({ type: 'done', result });
} catch (err) {
  // A thrown error inside a worker terminates it with an 'error' event and no
  // detail worth reading. Reporting it as a message instead means the job can
  // be marked failed with something a person can act on.
  post({ type: 'error', message: err?.message ?? 'Generation failed', stack: err?.stack });
}
