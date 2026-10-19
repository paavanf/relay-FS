// swapRoleVacuity.test.js
// The role and filter properties only mean something if roles and filters
// actually get in the way in the random cases. This counts, over a thousand
// of them with random "what would you take in return?" filters, how many
// candidate hand-overs the exact-role check and the filters each rule out,
// and what that leaves: a direct swap, only a longer chain, or nothing.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findSwapOptions } from '../../../src/engine/index.js';
import { buildGraph } from '../../../src/engine/swaps/buildGraph.js';
import { filteredCaseArb } from './swapArbitraries.js';
import { report } from './report.js';

const CASES = 1000;

describe('roles and filters on random cases', () => {
  it('both rule out a real share of hand-overs', () => {
    const pairs = { considered: 0, role: 0, filter: 0 };
    const outcome = { direct: 0, onlyChains: 0, nothing: 0 };

    for (const c of fc.sample(filteredCaseArb, { numRuns: CASES, seed: 20260419 })) {
      if (c.offers.length < 2) continue;
      const assignmentsById = new Map(c.assignments.map((a) => [a.id, a]));
      const graph = buildGraph({ offers: c.offers, assignmentsById, context: c.context });

      for (const taker of c.offers) for (const offer of c.offers) if (taker.membershipId !== offer.membershipId) pairs.considered += 1;
      for (const codes of graph.blocked.values()) {
        if (codes.includes('QUALIFICATION_MISMATCH')) pairs.role += 1;
        if (codes.includes('FILTER_MISMATCH')) pairs.filter += 1;
      }

      const result = findSwapOptions({ request: c.request, offers: c.offers, assignments: c.assignments, context: c.context, maxLength: 4 });
      if (result.direct.length > 0) outcome.direct += 1;
      else if (result.chains.length > 0) outcome.onlyChains += 1;
      else outcome.nothing += 1;
    }

    const share = (n, of) => `${((100 * n) / of).toFixed(1)}%`;
    const cases = outcome.direct + outcome.onlyChains + outcome.nothing;
    report(
      `\nRoles and filters over ${cases} random cases (${pairs.considered} candidate hand-overs)`,
      `  ruled out by the exact-role check:   ${pairs.role} (${share(pairs.role, pairs.considered)})`,
      `  ruled out by what the taker would take: ${pairs.filter} (${share(pairs.filter, pairs.considered)})`,
      `  outcomes: direct ${share(outcome.direct, cases)}, only longer chains ${share(outcome.onlyChains, cases)}, nothing ${share(outcome.nothing, cases)}`,
    );

    expect(pairs.role / pairs.considered).toBeGreaterThan(0.02);
    expect(pairs.filter / pairs.considered).toBeGreaterThan(0.2);
    expect(outcome.onlyChains).toBeGreaterThan(0);
  }, 120_000);
});
