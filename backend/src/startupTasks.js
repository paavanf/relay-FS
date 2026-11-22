// startupTasks.js
// What the API does once, as it starts: says which email transport is active
// (and whether it can reach anyone), and records as failed every generation
// job a stopped server left behind - only jobs past the run deadline
// (services/roster/abandonedJobs.js), so never one that another server could
// still be running.

import { logger } from './utils/logger.js';
import { logEmailConfiguration } from './services/email/startupLog.js';
import { failAbandonedJobs } from './services/roster/abandonedJobs.js';

export function runStartupTasks() {
  logEmailConfiguration();

  failAbandonedJobs()
    .then((count) => {
      if (count > 0) logger.info({ count }, 'Recorded generation jobs left by a stopped server as failed');
    })
    .catch((err) => logger.warn({ err: err.message }, 'Could not check for generation jobs left by a stopped server'));
}
