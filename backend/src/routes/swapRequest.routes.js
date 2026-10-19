// swapRequest.routes.js
// Mounted under /orgs/:orgId/swap-requests.
//
// Any member may offer their own shift, list what they may see, change or
// withdraw their own offer, and look at the options for a request they may
// see - the services decide whose is whose.
//
// The options search is expensive, so it has its own, tighter rate limit,
// counted per person rather than per address. Off in test mode, like the
// other limiters: an automated run makes many requests from one place.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { env } from '../config/env.js';
import { SWAP_OPTIONS_RATE_LIMIT } from '../config/swaps.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { createSwapRequestSchema, updateSwapRequestSchema, swapRequestParamSchema } from '../validators/swapRequest.validators.js';
import { create, list, cancel, update, options } from '../controllers/swapRequest.controller.js';

const router = Router({ mergeParams: true });

const optionsLimiter = rateLimit({
  windowMs: SWAP_OPTIONS_RATE_LIMIT.windowMs,
  max: SWAP_OPTIONS_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.userId}`,
  skip: () => env.isTest,
});

router.get('/', authenticate, validate({ params: orgIdParamSchema }), resolveMembership, asyncHandler(list));

router.post(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema, body: createSwapRequestSchema }),
  resolveMembership,
  asyncHandler(create),
);

router.patch(
  '/:requestId',
  authenticate,
  validate({ params: swapRequestParamSchema, body: updateSwapRequestSchema }),
  resolveMembership,
  asyncHandler(update),
);

router.delete('/:requestId', authenticate, validate({ params: swapRequestParamSchema }), resolveMembership, asyncHandler(cancel));

router.get(
  '/:requestId/options',
  authenticate,
  optionsLimiter,
  validate({ params: swapRequestParamSchema }),
  resolveMembership,
  asyncHandler(options),
);

export default router;
