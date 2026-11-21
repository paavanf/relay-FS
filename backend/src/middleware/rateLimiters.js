// rateLimiters.js
// The limits counted per request, in memory (express-rate-limit): per
// address for the whole API, swap searches per person, and webhook calls
// per address. The numbers, and why each exists, are in config/constants.js.
// Sign-up, sign-in and reset emails are Supabase Auth's, and limited there
// (docs/deploy/SUPABASE.md, section 11).
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
import { RATE_LIMIT, SWAP_SEARCH_LIMIT, WEBHOOK_LIMIT } from '../config/constants.js';

export const limitsInTests = { on: false };

function limiter({ windowMs, max }, { message, keyGenerator }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
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

export const swapSearchLimiter = limiter(SWAP_SEARCH_LIMIT, {
  message: 'Too many swap searches in the last minute.',
  keyGenerator: (req) => `user:${req.userId}`,
});

export const webhookLimiter = limiter(WEBHOOK_LIMIT, { message: 'Too many webhook calls from your network.' });
