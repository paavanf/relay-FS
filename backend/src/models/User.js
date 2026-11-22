// User.js
// A person in Relay. Who they are is proven by Supabase Auth; this is
// everything Relay itself knows about them. Organisation-specific facts
// (role, hours, qualifications) live on Membership, not here, because one
// user can belong to several organisations with a different role in each.
//
// The old password fields that accounts from before the move to Supabase
// carried were removed from the live database on 22 Nov 2026, by a one-time
// cleanup (docs/deploy/SUPABASE.md, section 9). Nothing reads them, and
// every query that answers a request picks its fields by name.

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

    // The Supabase Auth user this person signs in as - their id, the token's
    // `sub`. Unset on an account from before the move to Supabase, until its
    // owner signs up again with the same email (services/identity).
    supabaseUserId: { type: String, unique: true, sparse: true },

    // Set when that Supabase user is deleted (the Supabase Auth webhook): its
    // old tokens are refused from then on, and the account can be linked
    // again if the person signs up with the same email.
    identityDeletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export default User;
