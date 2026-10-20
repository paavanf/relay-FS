// config.controller.js
// GET /api/v1/config - the server's public settings (publicConfig.service.js).

import { publicConfig } from '../services/config/publicConfig.service.js';

export function showConfig(req, res) {
  res.json(publicConfig());
}
