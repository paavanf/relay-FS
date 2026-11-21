// index.js
// Re-exports the auth services. Since the move to Supabase Auth there is one:
// who the signed-in person is in Relay. Checking a sign-in, and keeping the
// Relay user in step with it, is services/identity's job.

export { getCurrentUser } from './me.service.js';
