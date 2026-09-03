// organisation.routes.js
// Wires organisation endpoints. Middleware order matters here:
// authenticate -> validate -> resolveMembership -> authorize -> controller.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveMembership } from '../middleware/resolveMembership.js';
import { authorize } from '../middleware/authorize.js';
import { MANAGER_ROLES } from '../config/constants.js';
import {
  createOrgSchema,
  inviteSchema,
  orgIdParamSchema,
  inviteTokenParamSchema,
} from '../validators/organisation.validators.js';
import {
  createOrg,
  listMembers,
  inviteMember,
  acceptInviteHandler,
} from '../controllers/organisation.controller.js';

const router = Router();

// Create a new organisation (any authenticated user becomes its owner).
router.post('/', authenticate, validate({ body: createOrgSchema }), asyncHandler(createOrg));

// Accept an invite (any authenticated user).
// Declared before /:orgId/... so "invites" is never read as an orgId.
router.post(
  '/invites/:token/accept',
  authenticate,
  validate({ params: inviteTokenParamSchema }),
  asyncHandler(acceptInviteHandler),
);

// List members of an org (any active member).
router.get(
  '/:orgId/members',
  authenticate,
  validate({ params: orgIdParamSchema }),
  resolveMembership,
  asyncHandler(listMembers),
);

// Invite someone (managers and owners only).
router.post(
  '/:orgId/invites',
  authenticate,
  validate({ params: orgIdParamSchema, body: inviteSchema }),
  resolveMembership,
  authorize(MANAGER_ROLES),
  asyncHandler(inviteMember),
);

export default router;
