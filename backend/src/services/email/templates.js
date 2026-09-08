// templates.js
// The HTML for the two emails Relay sends.
//
// Inline styles only - email clients strip <style> blocks, so there is no way
// to use the app's design tokens here. These hex values are the same brand
// teal defined in frontend/DESIGN.md, written out because an email cannot read
// a CSS variable. This file is the one place that exception applies.

const BRAND = '#0f766e';
const INK = '#17170f';
const MUTED = '#55554c';

function layout(bodyHtml) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif;
                max-width: 480px; margin: 0 auto; color: ${INK}; line-height: 1.5;">
      ${bodyHtml}
      <p style="color: ${MUTED}; font-size: 13px; margin-top: 32px;">
        Relay - fair rostering and shift swaps.
      </p>
    </div>
  `;
}

function button(href, label) {
  return `
    <a href="${href}"
       style="display: inline-block; background: ${BRAND}; color: #ffffff;
              padding: 12px 24px; border-radius: 8px; text-decoration: none;
              font-weight: 600;">
      ${label}
    </a>
  `;
}

export function passwordResetEmail(resetLink) {
  return layout(`
    <h2 style="color: ${INK}; font-size: 20px;">Reset your password</h2>
    <p>We received a request to reset your Relay password.</p>
    <p>Choose a new one using the button below. This link expires in an hour,
       and only the most recent link works.</p>
    ${button(resetLink, 'Reset password')}
    <p style="color: ${MUTED}; font-size: 13px; margin-top: 24px;">
      If you didn't request this, you can safely ignore this email - your
      password will not change.
    </p>
  `);
}

export function inviteEmail({ inviteLink, orgName, inviterName }) {
  // The inviter's name and the organisation both appear, because "someone
  // invited you to something" is what a phishing email looks like.
  const who = inviterName ? `${inviterName} invited you` : 'You have been invited';

  return layout(`
    <h2 style="color: ${INK}; font-size: 20px;">${who} to join ${orgName}</h2>
    <p>Relay builds fair staff rosters and finds shift swaps that work for
       everyone - including the three-way trades nobody would spot by hand.</p>
    <p>Accept the invitation to set up your account:</p>
    ${button(inviteLink, `Join ${orgName}`)}
    <p style="color: ${MUTED}; font-size: 13px; margin-top: 24px;">
      This invitation expires in 72 hours and can be used once. If you weren't
      expecting it, you can ignore this email.
    </p>
  `);
}
