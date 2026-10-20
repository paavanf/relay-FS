// health.controller.js
// GET /api/health and /api/v1/health: whether the API is up and can reach its
// database (503 when it cannot). With EXPOSE_CLIENT_IP=true - a temporary
// check after a deploy, off by default - it also reports the client address
// the server sees, and how many addresses the X-Forwarded-For chain held, so
// TRUST_PROXY can be confirmed (docs/deploy/DEPLOY.md).

import { dbStatus, isDbConnected } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function clientAddress(req) {
  const chain = String(req.get('x-forwarded-for') ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  return { clientIp: req.ip, forwardedHops: chain.length };
}

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
    ...(env.EXPOSE_CLIENT_IP ? clientAddress(req) : {}),
  });
});

export default { getHealth };
