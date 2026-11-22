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

export const INVITE_EXPIRY_HOURS = 72;

// Notifications are deleted this long after they were written, by a TTL
// index on createdAt (models/Notification.js). Nobody scrolls back further,
// and a public server should not keep every bell ring forever.
export const NOTIFICATION_TTL_DAYS = 90;

// The longest one roster generation can take, start to finish: the engine's
// 25-second budget, the 10 seconds' grace before its worker is killed, and
// loading the ward and writing the roster - with a wide margin. A claim on an
// organisation, or a job, older than this belongs to a server that stopped
// part-way (services/roster/generationClaim.js, abandonedJobs.js).
export const GENERATION_DEADLINE_MS = 2 * MINUTE;

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

// Sign-up, sign-in and password-reset emails are limited by Supabase Auth,
// per address and per project (docs/deploy/SUPABASE.md, section 11).

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

export { ROLES, ROLE_VALUES, MANAGER_ROLES, MEMBERSHIP_STATUS } from './roles.js';
export { ERROR_CODES } from './errorCodes.js';
