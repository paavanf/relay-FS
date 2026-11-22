// health.routes.js
// GET /api/health and /api/v1/health: whether the API is up and can reach its
// database. Mounted at both addresses (app.js, routes/index.js); the answer
// is built in controllers/health.controller.js.

import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

router.get('/', getHealth);

export default router;
