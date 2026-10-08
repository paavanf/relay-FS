// index.js
// Mounts all routers under their base paths.

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import organisationRoutes from './organisation.routes.js';
import qualificationRoutes from './qualification.routes.js';
import shiftTemplateRoutes from './shiftTemplate.routes.js';
import coverageRoutes from './coverage.routes.js';
import availabilityRoutes from './availability.routes.js';
import rosterRoutes from './roster.routes.js';
import jobRoutes from './job.routes.js';
import assignmentRoutes from './assignment.routes.js';
import fairnessRoutes from './fairness.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/orgs', organisationRoutes);

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

export default router;
