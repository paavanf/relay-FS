// requireJobSecret.js
// Guards the internal job endpoints (POST /internal/reap-expired), which a
// scheduler calls with no user behind it. It must send the shared secret
// from INTERNAL_JOB_SECRET in the X-Internal-Job-Secret header.
//
// Compared in constant time, after hashing both sides to the same length,
// so neither the time a wrong guess takes nor its length gives anything
// away. With no secret configured the endpoints are switched off entirely -
// an empty secret must never let anyone in.

import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { hashToken, safeEqual } from '../utils/crypto.js';

export const JOB_SECRET_HEADER = 'x-internal-job-secret';

export function requireJobSecret(req, res, next) {
  if (!env.INTERNAL_JOB_SECRET) {
    return next(new AppError('Internal jobs are not configured on this server.', 503, { code: 'NOT_CONFIGURED' }));
  }

  const given = req.get(JOB_SECRET_HEADER);
  if (!given || !safeEqual(hashToken(given), hashToken(env.INTERNAL_JOB_SECRET))) {
    return next(AppError.unauthorized('A valid job secret is required.'));
  }
  next();
}
