import { ERROR_CODES } from '../config/constants.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, { code, details, cause, isOperational = true } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? ERROR_CODES.INTERNAL;
    this.details = details;
    this.isOperational = isOperational;
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
