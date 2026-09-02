import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);

// Feature routers (auth, organisations, rosters, swaps...) mount here.

export default router;
