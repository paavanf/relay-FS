// undeliverableEmail.test.js
// The shared demo's accounts live on relay.test, and .test (RFC 2606) can
// never receive mail. With a real transport configured, deliver() must not
// hand such an address to it: visitors' actions in the demo would otherwise
// send a stream of emails that only bounce, and bounces cost the sender its
// standing with the mail provider.
//
// SMTP is switched on for this file before transport.js is loaded, with
// nodemailer replaced by a stand-in that records what it was asked to send.

import { describe, it, expect, beforeAll, vi } from 'vitest';

const sendMail = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }));

let deliver;
let EMAIL_TRANSPORT;

beforeAll(async () => {
  process.env.SMTP_USER = 'relay@example.com';
  process.env.SMTP_PASS = 'an-app-password';
  ({ deliver, EMAIL_TRANSPORT } = await import('../../src/services/email/transport.js'));
});

const message = (to) => ({ to, subject: 'Your shifts are published', html: '<p>See your shifts.</p>' });

describe('email to addresses that cannot receive it', () => {
  it('sends to a real address through the configured transport', async () => {
    expect(EMAIL_TRANSPORT).toBe('smtp');
    expect(await deliver(message('kim@example.com'))).toEqual({ delivered: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('never hands a reserved .test address - the demo accounts - to the transport', async () => {
    expect(await deliver(message('asha@relay.test'))).toMatchObject({ delivered: false });
    expect(await deliver(message('OWNER@Relay.TEST'))).toMatchObject({ delivered: false });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
