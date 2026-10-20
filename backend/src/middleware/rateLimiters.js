// rateLimiters.js
// The limits counted per request, in memory (express-rate-limit): per
// address for the whole API and for the auth endpoints, accounts created per
// address, reset emails per email address, and swap searches per person. The
// numbers, and why each exists, are in config/constants.js.
//
// Memory means one count per server process, emptied by a restart - right
// for one server. The limits counted from the database (invites, proposals,
// organisations) are in services/limits/.
//
// An address is req.ip, which is only the real client's address when
// TRUST_PROXY matches the proxies in front of the server (see app.js).
//
// Off in test mode, where the whole suite drives the API from one address;
// the tests of the limits switch them back on with limitsInTests.on = true.

import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { waitWords } from '../utils/waitWords.js';
import {
  RATE_LIMIT,
  AUTH_RATE_LIMIT,
  REGISTRATION_LIMIT,
  FORGOT_PASSWORD_LIMIT,
  SWAP_SEARCH_LIMIT,
} from '../config/constants.js';

export const limitsInTests = { on: false };

function limiter({ windowMs, max }, { message, keyGenerator, skipFailedRequests = false }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests,
    ...(keyGenerator ? { keyGenerator } : {}),
    skip: () => env.isTest && !limitsInTests.on,
    // The API's own error shape, through the error handler, with the wait in words.
    handler: (req, _res, next) => {
      const wait = (req.rateLimit.resetTime?.getTime() ?? Date.now() + windowMs) - Date.now();
      next(AppError.tooManyRequests(`${message} Try again ${waitWords(wait)}.`, { retryAfterMs: wait }));
    },
  });
}

export const apiLimiter = limiter(RATE_LIMIT, { message: 'Too many requests from your network.' });

export const authLimiter = limiter(AUTH_RATE_LIMIT, { message: 'Too many sign-in and password attempts from your network.' });

// Only accounts actually created count: a form sent back with a mistake does not.
export const registrationLimiter = limiter(REGISTRATION_LIMIT, {
  message: 'Too many accounts have been created from your network in the last hour.',
  skipFailedRequests: true,
});

// Keyed by the address the email would go to - registered or not, so the
// limit itself never reveals which addresses have accounts. Runs after
// validation, which is where the email is trimmed and lowercased.
export const forgotPasswordLimiter = limiter(FORGOT_PASSWORD_LIMIT, {
  message: 'Too many password reset emails have been asked for this address in the last hour.',
  keyGenerator: (req) => `email:${req.valid.body.email}`,
});

export const swapSearchLimiter = limiter(SWAP_SEARCH_LIMIT, {
  message: 'Too many swap searches in the last minute.',
  keyGenerator: (req) => `user:${req.userId}`,
});
