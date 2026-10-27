// authenticate.js
// Works out who is asking. The Bearer token is a Supabase access token (a
// test token, in the tests): services/identity checks it and finds - or,
// the first time, links or creates - the Relay user behind it.
//
// Every route after this one reads req.userId, Relay's own user id, so which
// organisations someone belongs to never depends on Supabase. req.identity
// keeps what the token said ({ externalId, email, name, emailProven }) for
// the few places that need it, such as accepting an invite.

import { resolveIdentity, syncUser } from '../services/identity/index.js';

export async function authenticate(req, res, next) {
  try {
    const identity = await resolveIdentity(req);
    const user = await syncUser(identity);
    req.identity = identity;
    req.userId = String(user._id);
    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
