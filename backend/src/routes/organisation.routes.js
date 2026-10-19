// organisation.routes.js
// Wires organisation endpoints. Middleware order matters here:
// authenticate -> validate -> resolveMembership -> authorize -> controller.
//
// Members (member.routes.js) and invites (invite.routes.js and
// orgInvite.routes.js) have routers of their own.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  createOrgSchema,
  orgIdParamSchema,
  updateRosterRulesSchema,
  updateSwapRulesSchema,
} from '../validators/organisation.validators.js';
import {
  createOrg,
  showRosterRules,
  saveRosterRules,
  showSwapRules,
  saveSwapRules,
} from '../controllers/organisation.controller.js';

const router = Router();

// Create a new organisation (any authenticated user becomes its owner).
router.post('/', authenticate, validate({ body: createOrgSchema }), asyncHandler(createOrg));

// Read the scheduling rules (any active member). Workers are scheduled under
// these, so they get to see them.
router.get(
  '/:orgId/roster-rules',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(showRosterRules),
);

// Change them (managers and owners only).
router.put(
  '/:orgId/roster-rules',
  authenticate,
  validate({ params: orgIdParamSchema, body: updateRosterRulesSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(saveRosterRules),
);

// The swap rules work the same way: every member may read them - workers
// see them on the Swaps page - and managers and owners change them.
router.get('/:orgId/swap-rules', authenticate, validate({ params: orgIdParamSchema }), resolveMembership, asyncHandler(showSwapRules));

router.put(
  '/:orgId/swap-rules',
  authenticate,
  validate({ params: orgIdParamSchema, body: updateSwapRulesSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(saveSwapRules),
);

export default router;
