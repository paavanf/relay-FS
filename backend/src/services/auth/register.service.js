// register.service.js
// Registers a new user account.

import { User } from '../../models/index.js';
import { hashPassword } from '../../utils/passwords.js';
import { AppError } from '../../errors/AppError.js';

export async function registerUser({ name, email, password }) {
  // The email arrives already lowercased by the Zod schema, so this compares
  // like-for-like against the stored (also lowercased) value.
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  // argon2id: memory-hard, the current password-hashing recommendation - at
  // the OWASP settings, two at a time (utils/passwords.js).
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return user;
}
