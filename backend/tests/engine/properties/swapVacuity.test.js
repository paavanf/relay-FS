// swapVacuity.test.js
// The swap properties are only worth something if the cases behind them
// actually find swaps - and also fail to. This samples a few thousand of the
// same random cases and counts what happened: a direct swap found, only
// longer chains, or nothing at all, and which rules blocked candidate edges
// (the pre-filter) and hand-overs that got past it (full validation).
//
// The counts are printed, and each outcome must turn up often enough that a
// property passing on it means something.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findSwapOptions } from '../../../src/engine/index.js';
import { swapCaseArb } from './swapArbitraries.js';
import { report } from './report.js';

const CASES = 2000;
const add = (into, from) => Object.entries(from).forEach(([code, n]) => (into[code] = (into[code] ?? 0) + n));

describe('swap search on random cases', () => {
  it('finds direct swaps, chains alone, and nothing, often enough to test all three', () => {
    const outcome = { 'direct swap found': 0, 'only longer chains': 0, 'nothing found': 0 };
    const edgeBlockers = {};
    const validationBlockers = {};
    let skipped = 0;
    let anyLongChain = 0; // a 3- or 4-person chain returned, with or without a direct swap

    for (const c of fc.sample(swapCaseArb, { numRuns: CASES, seed: 20260318 })) {
      if (c.offers.length < 2) {
        skipped += 1;
        continue;
      }
      const result = findSwapOptions({ request: c.request, offers: c.offers, assignments: c.assignments, context: c.context, maxLength: 4 });
      if (result.direct.length > 0) outcome['direct swap found'] += 1;
      else if (result.chains.length > 0) outcome['only longer chains'] += 1;
      else outcome['nothing found'] += 1;
      if (result.chains.length > 0) anyLongChain += 1;
      add(edgeBlockers, result.stats.edgeBlockers);
      add(validationBlockers, result.stats.validationBlockers);
    }

    const counted = CASES - skipped;
    const share = (n) => `${((100 * n) / counted).toFixed(1)}%`;
    report(
      `\nSwap search over ${counted} random cases (${skipped} skipped: fewer than two offers)`,
      ...Object.entries(outcome).map(([label, n]) => `  ${label.padEnd(20)} ${String(n).padStart(5)}  ${share(n)}`),
      `  ${'a 3-4 person chain'.padEnd(20)} ${String(anyLongChain).padStart(5)}  ${share(anyLongChain)}  (returned at all)`,
      `  Edges ruled out by the pre-filter: ${JSON.stringify(edgeBlockers)}`,
      `  Hand-overs ruled out by full validation: ${JSON.stringify(validationBlockers)}`,
    );

    // Floors set from a measured run (direct 55.5%, chains only 1.4%,
    // nothing 43.1%), well below it, so a regression shows and noise does
    // not. "Chains only" is naturally rare here: every random worker holds
    // RN and only the charge-nurse places need more, so when any swap works
    // a direct one usually does too. swapRoleVacuity.test.js measures the
    // role check and the "what would you take" filters on their own.
    expect(counted).toBeGreaterThan(CASES / 2);
    expect(outcome['direct swap found'] / counted).toBeGreaterThan(0.3);
    expect(outcome['nothing found'] / counted).toBeGreaterThan(0.1);
    expect(outcome['only longer chains']).toBeGreaterThanOrEqual(10);
    expect(anyLongChain / counted).toBeGreaterThan(0.1);
    // Full validation refuses hand-overs the pre-filter let through, for every timing rule.
    for (const code of ['MIN_REST', 'DOUBLE_BOOKED', 'MAX_WEEKLY_HOURS', 'MAX_CONSECUTIVE_DAYS']) expect(validationBlockers[code]).toBeGreaterThan(0);
  }, 120_000);
});
