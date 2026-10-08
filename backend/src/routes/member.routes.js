// member.routes.js
// Mounted under /orgs/:orgId/members.
//
// Any member may list the team. Changing or deactivating someone is for
// managers and owners - and which of the two may do what (roles are
// owner-only) is enforced in the services.
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
import { membershipIdParamSchema, updateMemberSchema } from '../validators/member.validators.js';
import { list, update, deactivate } from '../controllers/member.controller.js';

const router = Router({ mergeParams: true });

router.get('/', authenticate, validate({ params: orgIdParamSchema }), resolveMembership, asyncHandler(list));

router.patch(
  '/:membershipId',
  authenticate,
  validate({ params: membershipIdParamSchema, body: updateMemberSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(update),
);

// A soft deactivation, never a hard delete - see deactivateMember.service.js.
router.delete(
  '/:membershipId',
  authenticate,
  validate({ params: membershipIdParamSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(deactivate),
);

export default router;
