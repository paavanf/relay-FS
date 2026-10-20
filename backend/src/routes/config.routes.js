// config.routes.js
// Mounted under /config. PUBLIC: the login and forgot-password pages read it
// before anyone is signed in. It holds nothing secret.

import { Router } from 'express';
import { showConfig } from '../controllers/config.controller.js';

const router = Router();

router.get('/', showConfig);

export default router;
