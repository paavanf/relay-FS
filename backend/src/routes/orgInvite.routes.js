// orgInvite.routes.js
// Mounted under /orgs/:orgId/invites: an organisation's own invites. Managers
// and owners only - workers neither send nor see invitations. Sending one is
// locked in the shared demo organisation (middleware/refuseInDemo.js).
//
// mergeParams so :orgId survives the mount path and reaches resolveMembership.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { refuseInDemo } from '../middleware/refuseInDemo.js';
import { MANAGER_ROLES } from '../config/constants.js';
import { orgIdParamSchema } from '../validators/organisation.validators.js';
import { inviteSchema, inviteIdParamSchema } from '../validators/invite.validators.js';
import { list, create, revoke } from '../controllers/invite.controller.js';

const router = Router({ mergeParams: true });
const managers = [resolveMembership, authorize(MANAGER_ROLES)];

router.get('/', authenticate, validate({ params: orgIdParamSchema }), ...managers, asyncHandler(list));

router.post(
  '/',
  authenticate,
  validate({ params: orgIdParamSchema, body: inviteSchema }),
  ...managers,
  refuseInDemo,
  asyncHandler(create),
);

router.delete(
  '/:inviteId',
  authenticate,
  validate({ params: inviteIdParamSchema }),
  ...managers,
  asyncHandler(revoke),
);

export default router;
