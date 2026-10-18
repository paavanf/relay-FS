// Organisation.js
// A team that rosters together. Every other record in Relay is scoped to one.

import mongoose from 'mongoose';
import { DEFAULT_ROSTER_RULES } from '../config/constants.js';
import { DEFAULT_SWAP_POLICY, SWAP_CHAIN_LENGTH_RANGE } from '../config/swaps.js';

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },

    // IANA timezone. Rosters are generated and displayed in this zone.
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },

    // The working-time rules every roster for this organisation is generated
    // against. Defaults are deliberately conservative: the constraint engine
    // skips a limit it cannot read, so leaving these unset would silently
    // produce rosters with no rest protection at all.
    rosterRules: {
      minRestHours: { type: Number, min: 0, max: 48, default: DEFAULT_ROSTER_RULES.minRestHours },
      maxConsecutiveDays: {
        type: Number,
        min: 1,
        max: 14,
        default: DEFAULT_ROSTER_RULES.maxConsecutiveDays,
      },
      maxHoursPerWeek: {
        type: Number,
        min: 1,
        max: 168,
        default: DEFAULT_ROSTER_RULES.maxHoursPerWeek,
      },
    },

    // How the swap chain finder treats this organisation. Only the chain
    // length for now: the longest chain of people it will suggest.
    swapPolicy: {
      maxChainLength: {
        type: Number,
        min: SWAP_CHAIN_LENGTH_RANGE.min,
        max: SWAP_CHAIN_LENGTH_RANGE.max,
        default: DEFAULT_SWAP_POLICY.maxChainLength,
      },
    },
  },
  { timestamps: true },
);

export const Organisation =
  mongoose.models.Organisation ?? mongoose.model('Organisation', organisationSchema);

export default Organisation;
