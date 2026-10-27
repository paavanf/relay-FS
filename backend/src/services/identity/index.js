// index.js
// Who is asking, from the Authorization header - the one door between Relay
// and whoever proves identities. Supabase Auth does in production; a test
// stand-in does in the tests (AUTH_MODE, config/authEnv.js).
//
//   resolveIdentity(req)  the verified token as { externalId, email, name,
//                         emailProven }, or a 401 (or 503) AppError
//   emailsAreProven()     whether emails from this sign-in can be trusted
//                         (for the webhook, which has no token to read)
//   syncUser(identity)    the Relay user behind an identity
//   updateIdentityEmail / deleteIdentity   what the webhook's events do
//
// The adapter is made on first use, from settings env.js has already checked.

import { env } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import { supabaseAdapter } from './supabaseAdapter.js';
import { testAdapter } from './testAdapter.js';

export { syncUser } from './syncUser.service.js';
export { updateIdentityEmail } from './updateIdentityEmail.service.js';
export { deleteIdentity } from './deleteIdentity.service.js';

let adapter;

function currentAdapter() {
  adapter ??=
    env.AUTH_MODE === 'test'
      ? testAdapter({ nodeEnv: env.NODE_ENV, secret: env.AUTH_TEST_SECRET })
      : supabaseAdapter({ url: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY });
  return adapter;
}

export async function resolveIdentity(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw AppError.unauthorized('No access token provided');
  return currentAdapter().resolve(header.slice('Bearer '.length));
}

export function emailsAreProven() {
  return currentAdapter().emailsAreProven();
}
