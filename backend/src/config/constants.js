export const API_PREFIX = '/api';

export const REQUEST_ID_HEADER = 'x-request-id';

export const JSON_BODY_LIMIT = '100kb';

export const RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

export const ROLES = Object.freeze({
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
});

export const ERROR_CODES = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_ERROR',
});
