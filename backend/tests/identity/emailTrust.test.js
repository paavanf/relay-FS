// emailTrust.test.js
// Whether emails from a Supabase project can be trusted - asked of the
// project's public settings, with a stand-in fetch and clock:
//
//   "Confirm email" on   (mailer_autoconfirm: false)  -> proven
//   "Confirm email" off  (mailer_autoconfirm: true)   -> not proven
//   no answer, or not 200                             -> not proven
//
// One request serves 10 minutes and every caller in that time; after a
// failure it asks again 30 seconds later.

import { describe, it, expect, vi } from 'vitest';
import { createEmailTrust } from '../../src/services/identity/emailTrust.js';

const URL_ = 'https://abcdefghijklmnopqrst.supabase.co';
const answer = (status, body = {}) => ({ ok: status === 200, status, json: async () => body });

function trustWith(fetchImpl) {
  const clock = { now: 1_000_000 };
  const emailsAreProven = createEmailTrust({ url: URL_, publishableKey: 'pk', fetchImpl, now: () => clock.now });
  return { emailsAreProven, clock };
}

describe('email trust', () => {
  it('trusts emails only while the project makes people confirm them', async () => {
    const confirming = vi.fn(async () => answer(200, { mailer_autoconfirm: false }));
    expect(await trustWith(confirming).emailsAreProven()).toBe(true);
    expect(confirming).toHaveBeenCalledWith(`${URL_}/auth/v1/settings`, expect.objectContaining({ headers: { apikey: 'pk' } }));

    const autoconfirming = async () => answer(200, { mailer_autoconfirm: true });
    expect(await trustWith(autoconfirming).emailsAreProven()).toBe(false);
  });

  it('does not trust them when the project cannot be asked', async () => {
    expect(await trustWith(async () => answer(503)).emailsAreProven()).toBe(false);
    expect(await trustWith(async () => Promise.reject(new TypeError('fetch failed'))).emailsAreProven()).toBe(false);
  });

  it('asks once per 10 minutes, and shares the answer with every caller meanwhile', async () => {
    const fetchImpl = vi.fn(async () => answer(200, { mailer_autoconfirm: false }));
    const { emailsAreProven, clock } = trustWith(fetchImpl);

    await Promise.all([emailsAreProven(), emailsAreProven(), emailsAreProven()]);
    clock.now += 9 * 60_000;
    await emailsAreProven();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock.now += 2 * 60_000;
    await emailsAreProven();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('asks again 30 seconds after a failure', async () => {
    const fetchImpl = vi.fn(async () => answer(500));
    const { emailsAreProven, clock } = trustWith(fetchImpl);

    await emailsAreProven();
    clock.now += 29_000;
    await emailsAreProven();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock.now += 2_000;
    await emailsAreProven();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
