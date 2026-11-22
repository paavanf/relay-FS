// server.js
// Starts the API: connects to the database, runs the start-up tasks, listens
// on PORT, and shuts down cleanly on SIGINT or SIGTERM. The app itself - its
// middleware and routes - is built in app.js.

import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runStartupTasks } from './startupTasks.js';

const app = createApp();
let server;

// Mongoose only auto-reconnects once a first connection has succeeded. If the
// very first attempt fails - an Atlas cluster still waking up is the usual
// reason - nothing retries, and the API serves 500s from every database route
// until someone notices and restarts it. So retry in the background, backing
// off up to 30s.
function retryConnectInBackground(attempt = 1) {
  const delayMs = Math.min(30_000, 2 ** attempt * 1000);

  setTimeout(async () => {
    try {
      await connectDb();
      logger.info('Database reconnected; the API is fully available again');
    } catch (err) {
      logger.warn({ err: err.message }, `Database still unreachable (attempt ${attempt})`);
      retryConnectInBackground(attempt + 1);
    }
    // unref so a pending retry never keeps the process alive on shutdown.
  }, delayMs).unref();
}

async function start() {
  try {
    await connectDb();
  } catch (err) {
    if (env.isProduction) throw err;
    // Keep the API up in development so the frontend still has something to
    // talk to; /api/health reports the database as disconnected.
    logger.warn({ err }, 'Starting without a database connection; retrying in the background');
    retryConnectInBackground();
  }

  // Done once, at boot: startupTasks.js.
  runStartupTasks();

  server = app.listen(env.PORT, () => {
    logger.info(`Relay API listening on http://localhost:${env.PORT}`);
  });

  // Otherwise a failed bind is a FATAL with a stack trace, which reads like a
  // crash; the usual cause is a second copy of this server. Say so and stop.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${env.PORT} is already in use, so the API cannot start. ` +
          'Another Relay backend is probably still running - stop that one, ' +
          `or start this with a different PORT (e.g. PORT=${env.PORT + 1} npm run dev).`,
      );
      process.exit(1);
    }

    logger.fatal({ err }, 'Server error');
    process.exit(1);
  });
}

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  const timer = setTimeout(() => process.exit(1), 10_000).unref();

  try {
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
    await disconnectDb();
    clearTimeout(timer);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
