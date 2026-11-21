// config.routes.js
// Mounted under /config. PUBLIC: it says whether this deployment sends email,
// and holds nothing secret.

import { Router } from 'express';
import { showConfig } from '../controllers/config.controller.js';

const router = Router();

router.get('/', showConfig);

export default router;
