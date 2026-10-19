// index.js
// Mounts all routers under their base paths.

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import organisationRoutes from './organisation.routes.js';
import inviteRoutes from './invite.routes.js';
import orgInviteRoutes from './orgInvite.routes.js';
import memberRoutes from './member.routes.js';
import qualificationRoutes from './qualification.routes.js';
import shiftTemplateRoutes from './shiftTemplate.routes.js';
import coverageRoutes from './coverage.routes.js';
import availabilityRoutes from './availability.routes.js';
import rosterRoutes from './roster.routes.js';
import jobRoutes from './job.routes.js';
import assignmentRoutes from './assignment.routes.js';
import fairnessRoutes from './fairness.routes.js';
import swapRequestRoutes from './swapRequest.routes.js';
import swapChainRoutes from './swapChain.routes.js';
import notificationRoutes from './notification.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/orgs', organisationRoutes);

// Invites are found by token, before the person belongs to any organisation.
router.use('/invites', inviteRoutes);

// The people in an organisation, and the invitations still waiting.
router.use('/orgs/:orgId/members', memberRoutes);
router.use('/orgs/:orgId/invites', orgInviteRoutes);

// Rostering configuration, all scoped to one organisation. Each of these
// routers is created with mergeParams so :orgId from the mount path reaches
// its own middleware.
router.use('/orgs/:orgId/qualifications', qualificationRoutes);
router.use('/orgs/:orgId/shift-templates', shiftTemplateRoutes);
router.use('/orgs/:orgId/coverage', coverageRoutes);
router.use('/orgs/:orgId/availability', availabilityRoutes);

// Roster generation, and the background jobs that run it.
router.use('/orgs/:orgId/rosters', rosterRoutes);
router.use('/orgs/:orgId/jobs', jobRoutes);
router.use('/orgs/:orgId/assignments', assignmentRoutes);

// Who has been carrying the nights and weekends (Milestone 6).
router.use('/orgs/:orgId/fairness', fairnessRoutes);

// Swap requests and the swap chain finder (Milestone 7): offer a shift, see
// the direct swaps and chains that could take it.
router.use('/orgs/:orgId/swap-requests', swapRequestRoutes);

// Proposed swaps (Milestone 8): propose an option, accept, approve, and the
// atomic commit - plus the notifications those changes write.
router.use('/orgs/:orgId/swap-chains', swapChainRoutes);
router.use('/orgs/:orgId/notifications', notificationRoutes);

// Jobs a scheduler calls, guarded by a shared secret rather than a login.
router.use('/internal', internalRoutes);

export default router;
