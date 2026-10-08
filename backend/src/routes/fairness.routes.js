// fairness.routes.js
// Mounted under /orgs/:orgId/fairness.
//
// Any member may read; the service decides how much each one sees. Only
// managers and owners may force a recompute.
//
// mergeParams so :orgId survives the mount path and reaches resolveMembership.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { show, recompute } from '../controllers/fairness.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(show),
);

router.post(
  '/recompute',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(recompute),
);

export default router;
