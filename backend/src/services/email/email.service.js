// email.service.js
// Sends transactional emails via Resend.
// If no API key is configured, logs the email to the console (dev fallback).

import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(toEmail, resetLink) {
  // Dev fallback: no API key means just log the link so the flow is still
  // testable before any email setup is done.
  if (!resend) {
    logger.warn(`[EMAIL DEV MODE] Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your Relay password',
    html: buildResetEmailHtml(resetLink),
  });
}

function buildResetEmailHtml(resetLink) {
  // Inline styles only - email clients strip <style> blocks.
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Reset your password</h2>
      <p>We received a request to reset your Relay password.</p>
      <p>Click the button below to choose a new one. This link expires in 1 hour.</p>
      <a href="${resetLink}"
         style="display: inline-block; background: #4f46e5; color: white;
                padding: 12px 24px; border-radius: 8px; text-decoration: none;">
        Reset password
      </a>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}
