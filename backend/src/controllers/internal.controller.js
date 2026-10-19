// internal.controller.js
// HTTP layer for jobs a scheduler runs, with no user behind them. The
// route guards each with the shared job secret.

import { reapExpiredChains } from '../services/swapChain/index.js';

export async function reapExpired(req, res) {
  res.json(await reapExpiredChains());
}
