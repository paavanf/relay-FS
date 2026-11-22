// logger.js
// The API's one logger (pino): silent in tests, readable coloured lines at
// debug level in development, and JSON at info level in production. The
// Authorization and Cookie headers and password fields are written as
// [redacted]; request log lines are trimmed further by utils/logSafety.js.

import pino from 'pino';
import { env } from '../config/env.js';

const level = env.isTest ? 'silent' : env.isProduction ? 'info' : 'debug';

export const logger = pino({
  level,
  base: { service: 'relay-api' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password', 'passwordHash'],
    censor: '[redacted]',
  },
  transport: env.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' } },
});

export default logger;
