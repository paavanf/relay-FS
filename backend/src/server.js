import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
let server;

async function start() {
  try {
    await connectDb();
  } catch (err) {
    if (env.isProduction) throw err;
    // Keep the API up in development so the frontend still has something to
    // talk to; /api/health reports the database as disconnected.
    logger.warn({ err }, 'Starting without a database connection');
  }

  server = app.listen(env.PORT, () => {
    logger.info(`Relay API listening on http://localhost:${env.PORT}`);
  });

  // Without this, a failed bind reaches the uncaughtException handler and is
  // reported as a FATAL with a stack trace, which reads like a crash in the
  // app. The usual cause is far more mundane: a second copy of this server is
  // already running. Say that plainly and stop.
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
