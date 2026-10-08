// recomputeLedger.service.js
// Rebuilds one organisation's fairness ledger from scratch.
//
// RECOMPUTE, NEVER PATCH. Nudging stored totals up and down as rosters change
// drifts over time, and nothing would ever notice the drift. Recomputing twelve
// weeks for one organisation is cheap, and always exactly right.
//
// The window ends on the last day of the most recently published roster. A
// roster published for next week therefore counts as soon as it is published:
// it is the work people are now committed to. No published roster, no ledger.

import mongoose from 'mongoose';
import { Organisation, Roster, FairnessLedger } from '../../models/index.js';
import { computeLedger, fairnessWindow } from '../../engine/index.js';
import { FAIRNESS_WINDOW_DAYS } from '../../config/fairness.js';
import { AppError } from '../../errors/AppError.js';
import { loadLedgerInput } from './loadLedgerInput.service.js';

export async function recomputeLedger({ orgId }) {
  const org = await Organisation.findById(orgId).lean();
  if (!org) throw AppError.notFound('Organisation not found');

  const latest = await Roster.findOne({ orgId, status: 'published' })
    .sort({ endDate: -1 })
    .select('endDate')
    .lean();

  const window = latest ? fairnessWindow(latest.endDate, FAIRNESS_WINDOW_DAYS) : null;
  const ledger = window ? computeLedger(await loadLedgerInput({ org, window })) : null;
  const computedAt = new Date();

  await replaceRows({ orgId, ledger, computedAt });
  return { window, computedAt };
}

// Delete and rewrite together: a reader never sees half of an old ledger and
// half of a new one.
async function replaceRows({ orgId, ledger, computedAt }) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await FairnessLedger.deleteMany({ orgId }, { session });
      if (!ledger || ledger.rows.length === 0) return;

      await FairnessLedger.insertMany(
        ledger.rows.map((row) => toDocument(row, { orgId, ledger, computedAt })),
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

function toDocument(row, { orgId, ledger, computedAt }) {
  return {
    orgId,
    membershipId: row.membershipId,
    windowStart: ledger.window.startDate,
    windowEnd: ledger.window.endDate,
    totalBurden: row.totalBurden,
    hoursWorked: row.hoursWorked,
    shiftsWorked: row.shiftsWorked,
    contractedHoursPerWeek: row.contractedHoursPerWeek,
    basisHours: row.basisHours,
    measured: row.measured,
    normalisedBurden: row.normalisedBurden,
    deviationPercent: row.deviationPercent,
    shiftCounts: row.shiftCounts,
    teamAverage: ledger.teamAverage,
    computedAt,
  };
}
