// index.js
// Mounts all routers under their base paths.

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import organisationRoutes from './organisation.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/orgs', organisationRoutes);

export default router;
