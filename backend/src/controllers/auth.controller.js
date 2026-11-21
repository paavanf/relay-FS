// auth.controller.js
// HTTP layer for GET /auth/me: who the signed-in person is in Relay, with
// their organisations. Signing in itself is Supabase Auth's; by the time a
// request gets here, authenticate has checked the token and found (or made)
// the Relay user it belongs to.

import { getCurrentUser } from '../services/auth/index.js';

export async function me(req, res) {
  // req.userId is set by the authenticate middleware.
  const result = await getCurrentUser(req.userId);
  res.json(result);
}
