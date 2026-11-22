// AppError.js
// The error the API throws on purpose: a message a person can read, an HTTP
// status, and a code from ERROR_CODES (config/constants.js). Make one with a
// helper - AppError.notFound(), AppError.conflict() and so on - and
// middleware/errorHandler.js turns it into the API's one error shape.

import { ERROR_CODES } from '../config/constants.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, { code, details, cause, isOperational = true, retryAfterMs } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? ERROR_CODES.INTERNAL;
    this.details = details;
    this.isOperational = isOperational;
    // For a 429: how long until trying again can work. Sent as Retry-After.
    this.retryAfterMs = retryAfterMs;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message = 'Bad request', options) {
    return new AppError(message, 400, { code: ERROR_CODES.BAD_REQUEST, ...options });
  }

  static unauthorized(message = 'Authentication required', options) {
    return new AppError(message, 401, { code: ERROR_CODES.UNAUTHORIZED, ...options });
  }

  static forbidden(message = 'Not allowed', options) {
    return new AppError(message, 403, { code: ERROR_CODES.FORBIDDEN, ...options });
  }

  static notFound(message = 'Resource not found', options) {
    return new AppError(message, 404, { code: ERROR_CODES.NOT_FOUND, ...options });
  }

  static conflict(message = 'Conflict', options) {
    return new AppError(message, 409, { code: ERROR_CODES.CONFLICT, ...options });
  }

  // Every limit uses this - the address limits and the abuse limits - so a
  // client can tell "slow down" from any other refusal. The message says when
  // to try again; options.retryAfterMs says it to machines.
  static tooManyRequests(message = 'Too many requests', options) {
    return new AppError(message, 429, { code: ERROR_CODES.RATE_LIMITED, ...options });
  }

  // The shared demo organisation's locked setup, and its accounts kept in it
  // (config/demo.js has the messages). A 403 with a code of its own, so the
  // frontend can tell "locked in the demo" from "not your role".
  static demoLocked(message) {
    return new AppError(message, 403, { code: ERROR_CODES.DEMO_LOCKED });
  }

  static validation(details, message = 'Validation failed') {
    return new AppError(message, 422, { code: ERROR_CODES.VALIDATION_FAILED, details });
  }

  // For faults that are our bug, not the caller's - e.g. middleware wired up
  // in the wrong order. Marked non-operational so it is logged as an error.
  static internal(message = 'Internal server error', options) {
    return new AppError(message, 500, {
      code: ERROR_CODES.INTERNAL,
      isOperational: false,
      ...options,
    });
  }
}

export default AppError;
