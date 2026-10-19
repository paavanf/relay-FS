// chainStateProperties.test.js
// The swap chain state machine under random runs of events
// (chainArbitraries.js). After every single step:
//
//   1. a committed chain has every leg accepted - and, where approval is
//      required, a manager's approval behind it
//   2. a terminal chain holds no reservations; a live one still does
//   3. a chain reaches at most one terminal state - once ended, it never
//      moves to another
//   4. nothing becomes committed except through a commit event
//
// The services store exactly what transition() returns, so these hold for
// every chain in the database too. chainStateVacuity.test.js shows the runs
// really do reach every ending.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TERMINAL_CHAIN_STATUSES } from '../../../src/engine/index.js';
import { scenarioArb, play } from './chainArbitraries.js';

const RUNS = 1000;
const isTerminal = (chain) => TERMINAL_CHAIN_STATUSES.includes(chain.status);

describe('the swap chain state machine, under random events', () => {
  it('never commits an unaccepted chain, never ends holding shifts, and never ends twice', () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        let firstEnd = null;
        play(scenario, (chain) => {
          if (chain.status === 'committed') {
            expect(chain.legs.every((leg) => leg.acceptedAt)).toBe(true);
            if (chain.requiresApproval) expect(chain.endedBy.action).toBe('approve');
          }
          expect(chain.reservationsHeld).toBe(!isTerminal(chain));
          if (isTerminal(chain)) {
            firstEnd ??= chain.status;
            expect(chain.status).toBe(firstEnd);
          }
        });
      }),
      { numRuns: RUNS },
    );
  });

  it('commits only on a commit event', () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        play(scenario, (chain, event, result, before) => {
          if (chain.status === 'committed' && before.status !== 'committed') expect(event.type).toBe('committed');
        });
      }),
      { numRuns: RUNS },
    );
  });
});
