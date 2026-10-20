// transport.js
// Decides HOW an email leaves the building, and does the actual sending.
//
// Off entirely when EMAIL_ENABLED is false - the deployed demo, whose host
// blocks SMTP: no transport is built and nothing is sent. Otherwise three
// options, checked in this order:
//   smtp     - SMTP_USER is set. Reaches any real address, so this wins.
//   resend   - RESEND_API_KEY is set but no SMTP. Note that Resend's default
//              sender, onboarding@resend.dev, is a sandbox address: it only
//              delivers to the address that owns the Resend account. Reaching
//              anyone else needs a verified domain.
//   console  - neither is configured. Nothing is sent; the caller logs the
//              link instead, so the flow stays testable with no email setup.
//
// deliver() never throws. Callers treat email as best-effort - a password
// reset or an invite must succeed whether or not the message goes out.

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export function chooseTransport() {
  if (!env.EMAIL_ENABLED) return 'off';
  if (env.SMTP_USER && env.SMTP_PASS) return 'smtp';
  if (env.RESEND_API_KEY) return 'resend';
  return 'console';
}

export const EMAIL_TRANSPORT = chooseTransport();

// Built once and reused. Creating a transport per message would open a new
// connection every time.
const smtp =
  EMAIL_TRANSPORT === 'smtp'
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // 587 uses STARTTLS, negotiated after connecting
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

const resend = EMAIL_TRANSPORT === 'resend' ? new Resend(env.RESEND_API_KEY) : null;

// .test is reserved (RFC 2606) and can never receive mail - the shared demo's
// accounts live on relay.test. Visitors' actions in the demo would otherwise
// send them real emails that only bounce, and a stream of bounces damages the
// sender's standing with the mail provider.
const isUndeliverable = (to) => /\.test$/i.test(String(to).split('@').pop());

/**
 * Sends one message. Always resolves.
 * @returns {Promise<{ delivered: boolean, reason?: string }>}
 */
export async function deliver({ to, subject, html }) {
  if (EMAIL_TRANSPORT === 'off') {
    return { delivered: false, reason: 'Email is turned off on this server' };
  }
  if (EMAIL_TRANSPORT === 'console') {
    return { delivered: false, reason: 'No email transport configured' };
  }
  if (isUndeliverable(to)) {
    return { delivered: false, reason: 'A reserved .test address, which cannot receive mail' };
  }

  try {
    if (EMAIL_TRANSPORT === 'smtp') {
      await smtp.sendMail({ from: env.SMTP_USER, to, subject, html });
      logger.info({ to, transport: 'smtp' }, 'Email sent');
      return { delivered: true };
    }

    // Resend reports a rejected send by resolving with an error field rather
    // than throwing, so the result has to be inspected. Not checking it is
    // how a failed send becomes silence.
    const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });

    if (error) {
      logger.error({ to, reason: error.message ?? String(error) }, 'Email rejected by Resend');
      return { delivered: false, reason: error.message ?? String(error) };
    }

    logger.info({ to, transport: 'resend' }, 'Email sent');
    return { delivered: true };
  } catch (err) {
    // A network fault or bad credentials. Logged loudly, but swallowed here:
    // the caller's operation must not fail because email did.
    logger.error({ to, err: err.message }, 'Email delivery failed');
    return { delivered: false, reason: err.message };
  }
}
