// FairnessLedger.js
// One worker's row in an organisation's fairness ledger: how much of the
// unpopular work they carried over the window, and how that compares with the
// team.
//
// Rows are never edited. A recompute deletes the organisation's rows and writes
// them again from the published rosters, inside one transaction, so the ledger
// is always exactly what the engine computes - never a running total that has
// been patched up and down until it quietly drifted.

import mongoose from 'mongoose';

const shiftCountsSchema = new mongoose.Schema(
  {
    day: { type: Number, default: 0 },
    evening: { type: Number, default: 0 },
    night: { type: Number, default: 0 },
    weekend: { type: Number, default: 0 },
  },
  { _id: false },
);

const fairnessLedgerSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true },

  // The window these figures cover: local dates, both ends inclusive.
  windowStart: { type: String, required: true },
  windowEnd: { type: String, required: true },

  totalBurden: { type: Number, required: true },
  hoursWorked: { type: Number, required: true },
  shiftsWorked: { type: Number, default: 0 },
  contractedHoursPerWeek: { type: Number, default: 0 },
  // What their burden is measured against: their contracted hours a week (40
  // when none is on file) over the part of the window since they joined.
  basisHours: { type: Number, required: true },
  measured: { type: Boolean, required: true },
  normalisedBurden: { type: Number, required: true },
  deviationPercent: { type: Number, required: true },
  shiftCounts: { type: shiftCountsSchema, required: true },

  // The same on every row from one recompute.
  teamAverage: { type: Number, required: true },
  computedAt: { type: Date, required: true },
});

// One row per member per organisation; the recompute replaces them all.
fairnessLedgerSchema.index({ orgId: 1, membershipId: 1 }, { unique: true });

export const FairnessLedger =
  mongoose.models.FairnessLedger ?? mongoose.model('FairnessLedger', fairnessLedgerSchema);

export default FairnessLedger;
