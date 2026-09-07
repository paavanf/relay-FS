// qualification.routes.js
// Mounted under /orgs/:orgId/qualifications.
//
// mergeParams so :orgId from the mount path reaches validate and
// resolveMembership. Every member can read the config; only managers and
// owners can change it.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  createQualificationSchema,
  updateQualificationSchema,
  orgIdParamSchema,
  qualIdParamSchema,
} from '../validators/qualification.validators.js';
import { list, create, update, remove } from '../controllers/qualification.controller.js';

const router = Router({ mergeParams: true });

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
  validate({ params: orgIdParamSchema, body: createQualificationSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(create),
);

router.patch(
  '/:qualId',
  authenticate,
  validate({ params: qualIdParamSchema, body: updateQualificationSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(update),
);

router.delete(
  '/:qualId',
  authenticate,
  validate({ params: qualIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(remove),
);

export default router;
