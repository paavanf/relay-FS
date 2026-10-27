// webhook.routes.js
// Mounted under /webhooks. Calls from other services with no user behind
// them, each guarded by its own shared secret rather than a login.
//
//   POST /supabase-auth   a Supabase user's email changed, or the user was
//                         deleted (requireWebhookSecret.js; switched off
//                         unless SUPABASE_WEBHOOK_SECRET is set)

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { webhookLimiter } from '../middleware/rateLimiters.js';
import { requireWebhookSecret } from '../middleware/requireWebhookSecret.js';
import { supabaseAuthEventSchema } from '../validators/webhook.validators.js';
import { supabaseAuthEvent } from '../controllers/webhook.controller.js';

const router = Router();

router.post(
  '/supabase-auth',
  webhookLimiter,
  requireWebhookSecret,
  validate({ body: supabaseAuthEventSchema }),
  asyncHandler(supabaseAuthEvent),
);

export default router;
