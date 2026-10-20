// errorHandler.js
// Turns anything thrown into the API's one error shape:
//   { error: { code, message, details?, requestId } }
//
// In production nothing internal leaves in a response: a 5xx says only
// "Internal server error" with no details, no stack trace is sent, a
// duplicate-key error does not echo the clashing values, and a malformed id
// does not name the field it was read for. The whole error is still logged,
// with its request id, for whoever runs the server. A 429 also says when to
// try again in a Retry-After header.

import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const CODE_BY_STATUS = Object.freeze({
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  422: ERROR_CODES.VALIDATION_FAILED,
  429: ERROR_CODES.RATE_LIMITED,
});

function normalise(err) {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return AppError.validation(err.flatten());
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return AppError.validation(details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(env.isProduction ? 'A value in this request is not valid' : `Invalid value for "${err.path}"`);
  }

  if (err?.code === 11000) {
    return AppError.conflict('A record with those details already exists', env.isProduction ? {} : { details: err.keyValue });
  }

  if (err?.type === 'entity.parse.failed') {
    return AppError.badRequest('Malformed JSON body');
  }

  // body-parser and http-errors mark client faults with an exposable 4xx
  // status (entity.too.large, encoding.unsupported...). Those are the
  // caller's mistake, not ours, so they keep their status and a 4xx code.
  const status = err?.statusCode ?? err?.status;
  if (err?.expose === true && status >= 400 && status < 500) {
    return new AppError(err.message, status, {
      code: CODE_BY_STATUS[status] ?? ERROR_CODES.BAD_REQUEST,
    });
  }

  return new AppError(err?.message || 'Something went wrong', status ?? 500, {
    code: ERROR_CODES.INTERNAL,
    cause: err,
    isOperational: false,
  });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(err, req, res, next) {
  const error = normalise(err);

  const log = req.log ?? logger;
  if (error.statusCode >= 500) {
    log.error({ err: error, requestId: req.id }, error.message);
  } else {
    log.warn({ requestId: req.id, code: error.code }, error.message);
  }

  const hidden = env.isProduction && error.statusCode >= 500;
  if (error.retryAfterMs > 0) res.set('Retry-After', String(Math.ceil(error.retryAfterMs / 1000)));
  res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: hidden ? 'Internal server error' : error.message,
      ...(error.details && !hidden ? { details: error.details } : {}),
      requestId: req.id,
      ...(env.isProduction ? {} : { stack: error.stack }),
    },
  });
}

export default errorHandler;
