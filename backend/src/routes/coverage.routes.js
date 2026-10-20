// coverage.routes.js
// Mounted under /orgs/:orgId/coverage. Changes are for managers and owners,
// and locked in the shared demo organisation (refuseInDemo.js).
//
// PUT rather than POST because the write is an upsert of one rule, keyed by
// (shift template, day of week): sending it twice leaves the same state.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { refuseInDemo } from '../middleware/refuseInDemo.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  upsertCoverageSchema,
  orgIdParamSchema,
  coverageIdParamSchema,
} from '../validators/coverage.validators.js';
import { list, upsert, remove } from '../controllers/coverage.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(list),
);

router.put(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema, body: upsertCoverageSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  refuseInDemo,
  asyncHandler(upsert),
);

router.delete(
  '/:coverageId',
  authenticate,
  validate({ params: coverageIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  refuseInDemo,
  asyncHandler(remove),
);

export default router;
