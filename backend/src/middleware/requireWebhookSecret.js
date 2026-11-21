// requireWebhookSecret.js
// Guards POST /webhooks/supabase-auth, which Supabase calls with no user
// behind it. The trigger that calls it sends SUPABASE_WEBHOOK_SECRET as a
// Bearer token (docs/deploy/SUPABASE.md has the SQL).
//
// Compared in constant time, after hashing both sides to the same length -
// as the internal job secret is (requireJobSecret.js) - so neither the time
// a wrong guess takes nor its length gives anything away. With no secret
// configured the webhook does not exist: it answers 404 like any unknown
// path, and an empty secret can never let anyone in.

import { AppError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import { hashToken, safeEqual } from '../utils/crypto.js';
import { notFound } from './notFound.js';

export function requireWebhookSecret(req, res, next) {
  if (!env.SUPABASE_WEBHOOK_SECRET) return notFound(req, res, next);

  const header = req.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!given || !safeEqual(hashToken(given), hashToken(env.SUPABASE_WEBHOOK_SECRET))) {
    return next(AppError.unauthorized('A valid webhook secret is required.'));
  }
  next();
}
