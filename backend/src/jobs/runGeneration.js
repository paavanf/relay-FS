// runGeneration.js
// Spawns the generation worker, watches it, and guarantees it goes away.
//
// Concurrency is capped at ONE. Each worker holds the whole problem in memory
// and the free tier has about 512MB; two at once exhausts it and the host
// kills the process, which loses both jobs and every in-flight request with
// them. One at a time is slower and survivable.
//
// The one slot is taken with reserveWorker() before the caller awaits
// anything, so two requests at once cannot both take it, and given back with
// releaseWorker() however the run ends (services/roster/generationJob.js).
// Every exit path here - success, thrown error, timeout - resolves the promise
// and terminates the worker, so no thread is ever left behind.

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const WORKER_PATH = fileURLToPath(new URL('./generateRoster.worker.js', import.meta.url));

// See the note above: this is a memory limit, not a throughput choice.
export const MAX_CONCURRENT_GENERATIONS = 1;

// How long past its own deadline the worker gets before being killed. The
// engine stops itself at deadlineMs; this only catches a worker that has hung
// or ignored it.
const GRACE_MS = 10_000;

let running = 0;

/** Takes the worker slot there and then, if it is free. False when it is taken. */
export function reserveWorker() {
  if (running >= MAX_CONCURRENT_GENERATIONS) return false;
  running += 1;
  return true;
}

/** Gives the slot back. Called once for every reserveWorker() that returned true. */
export function releaseWorker() {
  running = Math.max(0, running - 1);
}

/**
 * @param {Object} payload      plain input for the engine
 * @param {Function} [onProgress]  (percent, metrics) => void
 * @returns {Promise<Object>}   the generator's result
 */
export function runGeneration(payload, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { workerData: payload });

    let settled = false;

    // One place that cleans up, so no path can leave the worker alive.
    function finish(err, result) {
      if (settled) return;
      settled = true;

      clearTimeout(timer);
      worker.terminate().catch(() => {});

      if (err) reject(err);
      else resolve(result);
    }

    const timer = setTimeout(
      () => finish(new Error('Generation timed out and was stopped')),
      (payload.deadlineMs ?? 30_000) + GRACE_MS,
    );

    worker.on('message', (message) => {
      if (message.type === 'progress') onProgress?.(message.percent, message.metrics);
      else if (message.type === 'done') finish(null, message.result);
      else if (message.type === 'error') finish(new Error(message.message));
    });

    // 'error' fires for a fault the worker could not catch itself; 'exit' with
    // a non-zero code covers it being killed from outside.
    worker.on('error', (err) => finish(err));
    worker.on('exit', (code) => {
      if (code !== 0) finish(new Error(`Generation worker exited with code ${code}`));
      else finish(new Error('Generation worker exited without returning a result'));
    });

    logger.info({ startDate: payload.startDate, endDate: payload.endDate }, 'Generation started');
  });
}
