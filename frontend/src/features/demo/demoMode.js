// demoMode.js
// Whether this build is the public demo - VITE_DEMO_MODE=true when it was
// built - and the sentence a locked part of the demo shows. The flag only
// changes what the login and landing pages offer; the demo organisation's
// locks are the server's, and hold in any build.

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// The server's own words for a locked change (backend/src/config/demo.js).
export const DEMO_LOCK_REASON = 'This is a shared demo, so this setting is locked. Create your own organisation to change it.';
