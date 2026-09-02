import { dbStatus, isDbConnected } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (req, res) => {
  const database = dbStatus();
  const healthy = isDbConnected();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'relay-api',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    database,
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

export default { getHealth };
