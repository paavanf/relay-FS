export const API_PREFIX = '/api';

// Versioned surface. Feature endpoints live here; /api/health stays unversioned
// so simple uptime probes never have to care about the version.
export const API_V1_PREFIX = '/api/v1';

export const REQUEST_ID_HEADER = 'x-request-id';

export const JSON_BODY_LIMIT = '100kb';

export const RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

// Auth endpoints get a much tighter budget than the rest of the API to slow
// down credential stuffing and brute-force attempts.
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_AUTH_MAX = 30;

// Access tokens are short-lived; the refresh cookie is what gives a session
// its length. Keeping the access token brief limits the damage if one leaks.
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const INVITE_EXPIRY_HOURS = 72;

// Per-account brute-force protection. The IP rate limiter above slows an
// attacker down; this stops one specific account being ground through from
// many addresses. Short enough that a genuine user who mistyped is not
// seriously inconvenienced.
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_MINUTES = 3;

export const REFRESH_COOKIE_NAME = 'relay_refresh';

// The refresh cookie is only ever sent to the auth endpoints that need it.
export const REFRESH_COOKIE_PATH = `${API_V1_PREFIX}/auth`;

export const ROLES = Object.freeze({
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

// Roles that may manage an organisation (invite people, change settings).
export const MANAGER_ROLES = Object.freeze([ROLES.OWNER, ROLES.MANAGER]);

export const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'active',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
  REMOVED: 'removed',
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

// Aggregate view of the values above, so services can write `constants.X`
// instead of importing each name individually.
export const constants = Object.freeze({
  API_PREFIX,
  API_V1_PREFIX,
  REQUEST_ID_HEADER,
  JSON_BODY_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
  INVITE_EXPIRY_HOURS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCKOUT_MINUTES,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  ROLES,
  ROLE_VALUES,
  MANAGER_ROLES,
  MEMBERSHIP_STATUS,
  ERROR_CODES,
});
