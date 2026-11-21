// emailTrust.js
// Answers one question for the Supabase adapter: does this Supabase project
// make people confirm their email address before they can sign in?
//
// It matters because Relay links a sign-in to an existing account by email,
// copies a changed email across, and accepts invites by email - each safe
// only if the address was proven. Supabase proves it with a confirmation
// link while "Confirm email" is on (the default for hosted projects). With
// it off, Supabase marks every address confirmed without sending anything,
// and nothing in the token tells the two apart. So we ask the project: its
// public settings (GET /auth/v1/settings) include mailer_autoconfirm.
//
// The answer is cached for 10 minutes, and concurrent callers share one
// request. Any failure counts as "not proven" for 30 seconds, so a Supabase
// outage can only ever refuse a link, never allow one.

import { logger } from '../../utils/logger.js';

const TEN_MINUTES = 10 * 60_000;
const AFTER_FAILURE = 30_000;

export function createEmailTrust({ url, publishableKey, fetchImpl = fetch, now = Date.now }) {
  let cached = { value: null, until: 0 };
  let pending = null;

  async function ask() {
    try {
      const response = await fetchImpl(`${url}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return { value: false, ttl: AFTER_FAILURE, why: `settings answered ${response.status}` };
      const settings = await response.json();
      if (settings.mailer_autoconfirm === false) return { value: true, ttl: TEN_MINUTES };
      return { value: false, ttl: TEN_MINUTES, why: '"Confirm email" is off in this Supabase project' };
    } catch (error) {
      return { value: false, ttl: AFTER_FAILURE, why: `settings unreachable (${error.name})` };
    }
  }

  async function refresh() {
    const { value, ttl, why } = await ask();
    if (!value && cached.value !== false) logger.warn({ why }, 'Emails are not proven: existing accounts will not be linked');
    cached = { value, until: now() + ttl };
    pending = null;
    return value;
  }

  return async function emailsAreProven() {
    if (now() < cached.until) return cached.value;
    pending ??= refresh();
    return pending;
  };
}
