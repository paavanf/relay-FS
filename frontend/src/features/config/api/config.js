// config.js
// The server's public settings (GET /api/v1/config) - today, whether it
// sends email at all.
import { api } from '../../../lib/apiClient.js';

export const getConfig = () => api.get('/config');
