// startupLog.js
// Says once, at boot, exactly what email is going to do.
//
// The failure this prevents is the quiet one: the app looks configured, the UI
// says "check your inbox", and nothing ever arrives. Reading one line in the
// startup log should be enough to know which of those is happening.

import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { EMAIL_TRANSPORT } from './transport.js';

const SANDBOX_SENDER = 'onboarding@resend.dev';

export function logEmailConfiguration() {
  if (EMAIL_TRANSPORT === 'console') {
    logger.warn(
      'Email disabled - reset and invite links will be printed to the console. ' +
        'Set SMTP_USER and SMTP_PASS, or RESEND_API_KEY, to send real email.',
    );
    return;
  }

  if (EMAIL_TRANSPORT === 'smtp') {
    logger.info(`Email transport: SMTP via ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}`);
    return;
  }

  logger.info(`Email transport: Resend, sending as ${env.EMAIL_FROM}`);

  // The single most common reason "the email never arrived": the sandbox
  // sender silently refuses every recipient except the account owner.
  if (env.EMAIL_FROM === SANDBOX_SENDER) {
    logger.warn(
      `EMAIL_FROM is still ${SANDBOX_SENDER}, which is Resend's sandbox sender. ` +
        'It only delivers to the address that owns the Resend account - everyone ' +
        'else gets nothing. Verify a domain, or use SMTP instead.',
    );
  }
}
