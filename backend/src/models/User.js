// User.js
// A person with a Relay login. Organisation-specific facts (role, hours,
// qualifications) live on Membership, not here, because one user can belong
// to several organisations with a different role in each.

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    // Always stored lowercase so lookups are case-insensitive.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Argon2id hash. Never the raw password.
    passwordHash: { type: String, required: true },

    // Brute-force bookkeeping. Counts consecutive failures only: one correct
    // password resets it to zero.
    failedLoginAttempts: { type: Number, default: 0 },

    // While this is in the future, login is refused before the password is
    // even checked. Null means the account is not locked.
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

// Defence in depth: even if a query forgets .select('-passwordHash'), the hash
// never reaches JSON output.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;
