// publicConfig.service.js
// What the frontend needs to know about how this server is set up, before
// anyone signs in - today only whether it sends email, which decides whether
// a new invite is offered as a link to copy and whether the email preference
// is shown. (Sign-up and password-reset emails are Supabase's, whatever this
// says.) Nothing secret, ever: anyone can read it.

import { env } from '../../config/env.js';

export function publicConfig() {
  return { emailEnabled: env.EMAIL_ENABLED };
}
