// password.controller.js
// HTTP layer for a forgotten password: asking for a reset link, and using
// one. Both answer without revealing whether an email address has an account.

import { requestPasswordReset, resetPassword } from '../services/auth/index.js';

export async function forgotPassword(req, res) {
  await requestPasswordReset(req.valid.body.email);

  // Deliberately identical whether or not the email is registered - a
  // different response here would let anyone test which emails have accounts.
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
}

export async function resetPasswordHandler(req, res) {
  await resetPassword({
    rawToken: req.params.token,
    newPassword: req.valid.body.password,
  });

  res.json({ message: 'Password reset successfully. You can now log in.' });
}
