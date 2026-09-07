// Qualification.js
// A skill or certification a shift can require, e.g. "Registered Nurse".
// Coverage requirements are expressed in terms of these.

import mongoose from 'mongoose';

const qualificationSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 60 },

    // Short handle used on the roster grid, where space is tight. Stored
    // uppercase so "rn" and "RN" cannot both exist in one organisation.
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },

    description: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true },
);

// A code identifies one qualification within an organisation.
qualificationSchema.index({ orgId: 1, code: 1 }, { unique: true });

export const Qualification =
  mongoose.models.Qualification ?? mongoose.model('Qualification', qualificationSchema);

export default Qualification;
