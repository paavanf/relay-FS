// constants.js
// The fixed values the API runs on: its paths, how long sessions and links
// last, and the limits that keep a public deployment usable - each limit
// with the reason it exists. Roles and error codes live in roles.js and
// errorCodes.js, re-exported at the bottom so imports from here still work.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const API_PREFIX = '/api';

// Versioned surface. Feature endpoints live here; /api/health stays unversioned
// so simple uptime probes never have to care about the version.
export const API_V1_PREFIX = '/api/v1';

export const REQUEST_ID_HEADER = 'x-request-id';

export const JSON_BODY_LIMIT = '100kb';

// Access tokens are short-lived; the refresh cookie is what gives a session
// its length. Keeping the access token brief limits the damage if one leaks.
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const REFRESH_COOKIE_NAME = 'relay_refresh';
// The refresh cookie is only ever sent to the auth endpoints that need it.
export const REFRESH_COOKIE_PATH = `${API_V1_PREFIX}/auth`;

export const INVITE_EXPIRY_HOURS = 72;

// Notifications are deleted this long after they were written, by a TTL
// index on createdAt (models/Notification.js). Nobody scrolls back further,
// and a public server should not keep every bell ring forever.
export const NOTIFICATION_TTL_DAYS = 90;

// The working-time rules a roster is generated against. Stored per
// organisation; these are the fallback for one created before the field
// existed. The constraint engine sits out any limit that is unset, so an
// organisation with no rules would get rosters with nobody's rest protected.
export const DEFAULT_ROSTER_RULES = Object.freeze({ minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48 });

// --- Abuse limits. A public deployment means strangers. Every limit answers
// 429 with a plain sentence saying when to try again.

// Any one address, across the whole API: plenty for a person clicking
// around, few enough to slow down a script hammering it.
export const RATE_LIMIT = Object.freeze({ windowMs: 15 * MINUTE, max: 300 });

// Login, registration and the two password-reset endpoints, per address:
// much tighter, to slow down credential stuffing and reset-token guessing.
export const AUTH_RATE_LIMIT = Object.freeze({ windowMs: 15 * MINUTE, max: 30 });

// New accounts from one address in an hour: a person needs one; a script
// filling the database with accounts needs thousands.
export const REGISTRATION_LIMIT = Object.freeze({ windowMs: HOUR, max: 5 });

// Reset emails asked for one email address in an hour, from any number of
// addresses: the form must not become a way to flood someone's inbox.
export const FORGOT_PASSWORD_LIMIT = Object.freeze({ windowMs: HOUR, max: 3 });

// Invites one organisation sends in a day. Each is an email to an address
// the sender typed in, so invites must not become a spam channel.
export const INVITE_LIMIT = Object.freeze({ windowMs: DAY, max: 20 });

// Organisations one account may create, ever. Each is a whole set of
// records; a real team needs one, and five covers trying things out.
export const ORGANISATIONS_PER_USER = 5;

// Swaps one person proposes in an hour. Each notifies everyone in it - and
// emails them - so a burst of proposals is a burst of messages to others.
export const SWAP_PROPOSAL_LIMIT = Object.freeze({ windowMs: HOUR, max: 10 });

// Swap option searches per person per minute. Each runs the chain finder,
// the most CPU-hungry request a worker can make.
export const SWAP_SEARCH_LIMIT = Object.freeze({ windowMs: MINUTE, max: 10 });

// Calls to the Supabase Auth webhook per address per minute. Supabase sends
// one per changed or deleted account; anything faster is someone guessing
// the secret.
export const WEBHOOK_LIMIT = Object.freeze({ windowMs: MINUTE, max: 60 });

// Per-account brute-force protection. The address limits above slow an
// attacker down; this stops one account being ground through from many
// addresses. Short, so a genuine user who mistyped is barely held up. The
// shared demo accounts are exempt: their password is public anyway, and a
// lock would only shut the next visitor out.
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_MINUTES = 3;

export { ROLES, ROLE_VALUES, MANAGER_ROLES, MEMBERSHIP_STATUS } from './roles.js';
export { ERROR_CODES } from './errorCodes.js';
