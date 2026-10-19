// chainStateVacuity.test.js
// The state machine's properties would pass trivially if random runs never
// got anywhere - if nothing were ever committed, say. This samples the same
// runs the properties check and counts how they end, so a change to the
// arbitraries that stops reaching an ending is caught.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { scenarioArb, play } from './chainArbitraries.js';
import { report } from './report.js';

const SAMPLES = 4000;

describe('random swap chain runs', () => {
  it('reach every ending a chain can have, in a fair share of runs', () => {
    const endings = {};
    for (const scenario of fc.sample(scenarioArb, { numRuns: SAMPLES, seed: 20260410 })) {
      const { status } = play(scenario);
      endings[status] = (endings[status] ?? 0) + 1;
    }

    const counts = Object.entries(endings).map(([status, n]) => `${status} ${((100 * n) / SAMPLES).toFixed(1)}%`);
    report(`Chain state machine, ${SAMPLES} random runs ended: ${counts.join(', ')}`);
    for (const status of ['proposed', 'awaiting_approval', 'committed', 'declined', 'cancelled', 'expired', 'failed']) {
      expect(endings[status] ?? 0, status).toBeGreaterThan(SAMPLES * 0.01);
    }
  });
});
