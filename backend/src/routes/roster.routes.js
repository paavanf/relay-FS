// roster.routes.js
// Mounted under /orgs/:orgId/rosters.
//
// mergeParams so :orgId survives the mount path and reaches resolveMembership.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import { generateParamsSchema, generateBodySchema } from '../validators/roster.validators.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { createRosterSchema, rosterIdParamSchema } from '../validators/assignment.validators.js';
import { generate, list, create, show, publish } from '../controllers/roster.controller.js';

const router = Router({ mergeParams: true });

// Any member may list and read. The controller hides drafts from workers.
router.get(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(list),
);

router.post(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema, body: createRosterSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(create),
);

router.get(
  '/:rosterId',
  authenticate,
  validate({ params: rosterIdParamSchema }),
  resolveMembership,
  asyncHandler(show),
);

// Publishing is one-way, so it is a manager's decision.
router.post(
  '/:rosterId/publish',
  authenticate,
  validate({ params: rosterIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(publish),
);

// Generating rewrites the whole roster, so it is a manager's decision.
router.post(
  '/:rosterId/generate',
  authenticate,
  validate({ params: generateParamsSchema, body: generateBodySchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(generate),
);

export default router;
