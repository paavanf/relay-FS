// register.service.js
// Registers a new user account.

import argon2 from 'argon2';
import { User } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function registerUser({ name, email, password }) {
  // The email arrives already lowercased by the Zod schema, so this compares
  // like-for-like against the stored (also lowercased) value.
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  // argon2id: memory-hard, the current password-hashing recommendation.
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return user;
}
