// availability.routes.js
// Mounted under /orgs/:orgId/availability.
//
// The /me routes are open to any member because they only ever touch the
// caller's own membership. Reading or writing someone else's goes through
// the :membershipId routes, which are manager-only.
//
// /me is declared before /:membershipId so "me" is never read as an id.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  setAvailabilitySchema,
  orgIdParamSchema,
  membershipIdParamSchema,
} from '../validators/availability.validators.js';
import { getMine, setMine, getForMember, setForMember } from '../controllers/availability.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/me',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(getMine),
);

router.put(
  '/me',
  authenticate,
  validate({ params: orgIdParamSchema, body: setAvailabilitySchema }),
  resolveMembership,
  asyncHandler(setMine),
);

router.get(
  '/:membershipId',
  authenticate,
  validate({ params: membershipIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(getForMember),
);

router.put(
  '/:membershipId',
  authenticate,
  validate({ params: membershipIdParamSchema, body: setAvailabilitySchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(setForMember),
);

export default router;
