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
