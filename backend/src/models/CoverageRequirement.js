// CoverageRequirement.js
// How many people holding which qualifications a shift needs on a given day
// of the week, e.g. "Sunday night needs 2 Registered Nurses".
//
// One document per (shift template, day of week) pair; the counts for each
// qualification live inside it.

import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    qualificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Qualification',
      required: true,
    },
    count: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: false },
);

const coverageRequirementSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },

    shiftTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShiftTemplate',
      required: true,
    },

    // 0 = Sunday, matching JavaScript's Date.getDay().
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },

    requirements: { type: [requirementSchema], default: [] },

    // When this rule started applying. Kept so a future change can be dated
    // rather than silently rewriting history.
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One rule per shift per weekday - the upsert relies on this pairing.
coverageRequirementSchema.index({ orgId: 1, shiftTemplateId: 1, dayOfWeek: 1 }, { unique: true });

export const CoverageRequirement =
  mongoose.models.CoverageRequirement ??
  mongoose.model('CoverageRequirement', coverageRequirementSchema);

export default CoverageRequirement;
