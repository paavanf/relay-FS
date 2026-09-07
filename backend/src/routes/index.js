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

export default router;
