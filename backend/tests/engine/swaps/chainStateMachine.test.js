// chainStateMachine.test.js
// Every allowed transition of a proposed swap chain, one by one, as the
// table in the README lists them. Refusals, repeats and expiry are in
// chainStateRefusals.test.js.

import { describe, it, expect } from 'vitest';
import { transition } from '../../../src/engine/index.js';
import * as f from './chainFixtures.js';

const step = (chain, event, now = f.NOW) => transition(chain, event, now);

describe('accepting', () => {
  it('marks only the accepting person\'s own leg, and the chain waits for the rest', () => {
    const result = step(f.chainOf(), f.accept('b'));
    expect(result).toMatchObject({ ok: true, changed: true, applied: 'accept', commit: false });
    expect(result.chain.status).toBe('proposed');
    expect(result.chain.legs.map((leg) => Boolean(leg.acceptedAt))).toEqual([true, true, false]);
  });

  it('counts the proposer as having accepted their own leg', () => {
    const direct = f.chainOf({ people: ['a', 'b'] });
    expect(step(direct, f.accept('b')).chain.status).toBe('awaiting_approval');
  });

  it('goes to awaiting approval on the last acceptance when the organisation requires approval', () => {
    const result = step(f.after(f.chainOf(), [f.accept('b')]), f.accept('c'));
    expect(result).toMatchObject({ ok: true, changed: true, commit: false });
    expect(result.chain.status).toBe('awaiting_approval');
  });

  it('is ready to commit on the last acceptance when no approval is needed', () => {
    const result = step(f.after(f.chainOf({ requiresApproval: false }), [f.accept('b')]), f.accept('c'));
    expect(result).toMatchObject({ ok: true, changed: true, commit: true });
    expect(result.chain.status).toBe('proposed');
  });

  it('changes nothing when someone accepts twice - and says so, rather than refusing', () => {
    const once = f.after(f.chainOf(), [f.accept('b')]);
    const result = step(once, f.accept('b'));
    expect(result).toMatchObject({ ok: true, changed: false });
    expect(result.chain).toBe(once);
  });
});

describe('ending a chain without it happening', () => {
  it.each([
    ['a participant declines', f.chainOf(), f.decline('b'), 'declined', 'decline'],
    ['a participant declines after everyone accepted', f.awaiting(), f.decline('c'), 'declined', 'decline'],
    ['the proposer cancels', f.chainOf(), f.cancel('a'), 'cancelled', 'cancel'],
    ['the proposer cancels while it waits for approval', f.awaiting(), f.cancel('a'), 'cancelled', 'cancel'],
    ['a manager rejects', f.awaiting(), f.reject, 'declined', 'reject'],
    ['its time runs out', f.chainOf(), f.expire, 'expired', 'expire'],
  ])('%s: it ends, and lets its shifts go', (_, chain, event, status, action) => {
    const now = event.type === 'expire' ? f.LATER : f.NOW;
    const result = step(chain, event, now);
    expect(result).toMatchObject({ ok: true, changed: true, applied: action });
    expect(result.chain).toMatchObject({ status, reservationsHeld: false, endedBy: { action } });
  });

  it('keeps a manager\'s reason for rejecting', () => {
    expect(f.rejected().rejectionReason).toBe('Not enough cover that night.');
  });
});

describe('approving and committing', () => {
  it('makes an approved chain ready to commit, remembering who approved it', () => {
    const result = step(f.awaiting(), f.approve);
    expect(result).toMatchObject({ ok: true, commit: true });
    expect(result.chain).toMatchObject({ status: 'awaiting_approval', approvedBy: 'm' });
  });

  it('commits an approved chain, recording the approval as what ended it', () => {
    expect(f.approvedAndCommitted()).toMatchObject({ status: 'committed', reservationsHeld: false, endedBy: { action: 'approve', membershipId: 'm' } });
  });

  it('commits a chain everyone accepted when no approval is needed', () => {
    expect(f.acceptedAndCommitted()).toMatchObject({ status: 'committed', endedBy: { action: 'accept' } });
  });

  it('fails a commit with its reason, and lets the shifts go', () => {
    expect(f.failed()).toMatchObject({ status: 'failed', reservationsHeld: false, failureReason: f.commitFailed.reason });
  });
});
