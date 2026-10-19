// chainStateRefusals.test.js
// What the swap chain state machine refuses, what it repeats, and how
// expiry overrides everything:
//
//   who may act       only participants accept or decline, only the
//                     proposer cancels
//   not yet           approving before everyone accepted, committing what
//                     is not ready, expiring before the deadline
//   after the end     every event on a terminal chain is refused - except
//                     repeating the action that ended it, which returns the
//                     same chain unchanged
//   expiry            a live chain past its expiresAt treats every event as
//                     expire; a chain that already ended stays as it ended

import { describe, it, expect } from 'vitest';
import { transition } from '../../../src/engine/index.js';
import * as f from './chainFixtures.js';

const step = (chain, event, now = f.NOW) => transition(chain, event, now);

describe('who may act', () => {
  it.each([
    [f.accept('stranger'), 'NOT_PARTICIPANT'],
    [f.decline('stranger'), 'NOT_PARTICIPANT'],
    [f.cancel('b'), 'NOT_PROPOSER'],
  ])('refuses %o', (event, code) => {
    expect(step(f.chainOf(), event)).toMatchObject({ ok: false, code });
  });
});

describe('not yet', () => {
  it.each([
    ['approving before everyone accepted', f.chainOf(), f.approve, 'NOT_AWAITING_APPROVAL'],
    ['rejecting before everyone accepted', f.chainOf(), f.reject, 'NOT_AWAITING_APPROVAL'],
    ['committing with a leg still waiting', f.chainOf({ requiresApproval: false }), f.committed, 'NOT_READY'],
    ['committing what a manager has not approved', f.awaiting(), f.committed, 'NOT_READY'],
    ['failing a commit that never started', f.awaiting(), f.commitFailed, 'NOT_READY'],
    ['expiring before the deadline', f.chainOf(), f.expire, 'NOT_DUE'],
  ])('refuses %s', (_, chain, event, code) => {
    expect(step(chain, event)).toMatchObject({ ok: false, code });
  });
});

describe('after the end', () => {
  const events = [f.accept('b'), f.decline('b'), f.cancel('a'), f.approve, f.reject, f.expire, f.committed, f.commitFailed];
  const repeats = {
    committedByApproval: ['accept', 'approve', 'committed'],
    committedByAcceptance: ['accept', 'committed'],
    declined: ['decline'],
    rejected: ['reject'],
    cancelled: ['cancel'],
    expired: ['expire'],
    failed: ['approve', 'commitFailed'],
  };
  const ended = {
    committedByApproval: f.approvedAndCommitted,
    committedByAcceptance: f.acceptedAndCommitted,
    declined: f.declined,
    rejected: f.rejected,
    cancelled: f.cancelled,
    expired: f.expired,
    failed: f.failed,
  };

  for (const [name, make] of Object.entries(ended)) {
    it(`${name}: repeats return it unchanged, and everything else is refused`, () => {
      const chain = make();
      for (const event of events) {
        const result = step(chain, event, f.LATER);
        if (repeats[name].includes(event.type)) expect(result, event.type).toMatchObject({ ok: true, changed: false, chain });
        else expect(result, event.type).toMatchObject({ ok: false });
      }
    });
  }
});

describe('expiry overrides every event', () => {
  const allowed = [f.accept('b'), f.decline('b'), f.cancel('a'), f.approve, f.reject, f.committed, f.commitFailed, f.expire];

  it.each(allowed.map((event) => [event.type, event]))('%s on a chain past its time expires it instead', (_, event) => {
    for (const chain of [f.chainOf(), f.awaiting(), f.after(f.awaiting(), [f.approve])]) {
      const result = step(chain, event, f.LATER);
      expect(result).toMatchObject({ ok: true, changed: true, applied: 'expire', commit: false });
      expect(result.chain).toMatchObject({ status: 'expired', reservationsHeld: false });
    }
  });

  it('expires exactly at the deadline, not a moment later', () => {
    expect(step(f.chainOf(), f.accept('b'), f.EXPIRES)).toMatchObject({ applied: 'expire' });
  });

  it('leaves a chain that has already happened as it is, however late', () => {
    const chain = f.approvedAndCommitted();
    expect(step(chain, f.accept('b'), f.LATER)).toMatchObject({ ok: true, changed: false, chain });
  });
});
