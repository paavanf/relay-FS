// assignment.routes.js
// Mounted under /orgs/:orgId/assignments.
//
// Reading is open to any member - that is how My Shifts works, and the
// controller narrows a worker to their own shifts. Every write is a manager's,
// and the service refuses anything but a draft.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate as validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  validateAssignmentSchema,
  listAssignmentsQuerySchema,
  assignmentIdParamSchema,
} from '../validators/assignment.validators.js';
import { list, create, update, remove, validate } from '../controllers/assignment.controller.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  validateRequest({ params: orgIdParamSchema, query: listAssignmentsQuerySchema }),
  resolveMembership,
  asyncHandler(list),
);

// Declared before POST '/' is irrelevant (different paths), but kept adjacent
// so the dry run is obviously the same shape as the real thing.
router.post(
  '/validate',
  authenticate,
  validateRequest({ params: orgIdParamSchema, body: validateAssignmentSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(validate),
);

router.post(
  '/',
  authenticate,
  validateRequest({ params: orgIdParamSchema, body: createAssignmentSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(create),
);

router.patch(
  '/:assignmentId',
  authenticate,
  validateRequest({ params: assignmentIdParamSchema, body: updateAssignmentSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(update),
);

router.delete(
  '/:assignmentId',
  authenticate,
  validateRequest({ params: assignmentIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(remove),
);

export default router;
