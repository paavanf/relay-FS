// app.js
// Builds the Express app: security headers, CORS, body parsing, the request
// log, the address-wide rate limit, every route, and the error handler.
// server.js starts it; the tests build their own with createApp().

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';

import routes from './routes/index.js';
import healthRoutes from './routes/health.routes.js';
import { requestContext } from './middleware/requestContext.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { API_PREFIX, API_V1_PREFIX, JSON_BODY_LIMIT } from './config/constants.js';
import { logger } from './utils/logger.js';
import { requestForLog, responseForLog } from './utils/logSafety.js';

const HEALTH_PATHS = [`${API_PREFIX}/health`, `${API_V1_PREFIX}/health`];

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // How many proxies stand between the internet and this server (TRUST_PROXY,
  // off by default). Express then takes the client's address from
  // X-Forwarded-For, counting that many hops back from the right, and req.ip -
  // so every per-address rate limit - uses it.
  //   too low  - 0 behind a proxy: every request seems to come from the proxy,
  //              so all visitors share one count and run out together.
  //   too high - more hops than there are proxies: the extra entries are
  //              whatever the client wrote in the header, so anyone can claim a
  //              fresh address per request and walk past every limit.
  // Set it to exactly the number of proxies the deployment runs behind.
  app.set('trust proxy', env.TRUST_PROXY || false);

  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      serializers: { req: requestForLog, res: responseForLog },
      // Not the health checks: the host asks every few seconds.
      autoLogging: { ignore: (req) => HEALTH_PATHS.includes(req.url) },
    }),
  );

  app.use(helmet());
  // credentials: true is required for the refresh-token cookie to travel.
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  // Unversioned liveness probe. Kept at /api/health so uptime checks and the
  // frontend status indicator never have to follow the API version.
  app.use(`${API_PREFIX}/health`, apiLimiter, healthRoutes);

  // Everything else is versioned: /api/v1/auth, /api/v1/orgs, ...
  app.use(API_V1_PREFIX, apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
