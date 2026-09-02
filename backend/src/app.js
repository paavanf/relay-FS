import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';

import routes from './routes/index.js';
import { requestContext } from './middleware/requestContext.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { API_PREFIX, JSON_BODY_LIMIT, RATE_LIMIT } from './config/constants.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url === `${API_PREFIX}/health` },
    }),
  );

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
  app.use(mongoSanitize());

  app.use(
    API_PREFIX,
    rateLimit({
      windowMs: RATE_LIMIT.windowMs,
      max: RATE_LIMIT.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    routes,
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
