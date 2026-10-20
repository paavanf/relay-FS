// publicConfig.service.js
// What the frontend needs to know about how this server is set up, before
// anyone signs in - today only whether it sends email, which decides whether
// "forgot password" can work and whether the email preference is offered.
// Nothing secret, ever: anyone can read it.

import { env } from '../../config/env.js';

export function publicConfig() {
  return { emailEnabled: env.EMAIL_ENABLED };
}
