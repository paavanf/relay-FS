// login.service.js
// Verifies email + password and returns the user document if valid.

import argon2 from 'argon2';
import { User } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });

  // Generic error message - never reveal whether the email exists.
  // This prevents user enumeration attacks.
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return user;
}
