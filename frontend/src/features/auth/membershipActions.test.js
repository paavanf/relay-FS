// membershipActions.test.js
// Joining an organisation you were in before must not list it twice, and
// editing one membership must leave the others alone.

import { describe, it, expect } from 'vitest';
import { membershipActions } from './membershipActions.js';

// Stands in for React's setState: applies each updater to the current list.
function listWith(initial) {
  let list = initial;
  const actions = membershipActions((update) => {
    list = update(list);
  });
  return { actions, current: () => list };
}

const ward = { orgId: 'o1', orgName: 'Ward 4B', role: 'member', qualificationIds: [] };
const clinic = { orgId: 'o2', orgName: 'Clinic', role: 'owner', qualificationIds: [] };

describe('membershipActions', () => {
  it('adds a new membership', () => {
    const { actions, current } = listWith([clinic]);
    actions.addMembership(ward);
    expect(current()).toEqual([clinic, ward]);
  });

  it('replaces an older entry for the same organisation instead of doubling it', () => {
    const { actions, current } = listWith([ward, clinic]);
    actions.addMembership({ ...ward, role: 'manager' });
    expect(current()).toEqual([clinic, { ...ward, role: 'manager' }]);
  });

  it('merges changes into one membership only', () => {
    const { actions, current } = listWith([ward, clinic]);
    actions.updateMembership('o2', { role: 'manager' });
    expect(current()).toEqual([ward, { ...clinic, role: 'manager' }]);
  });
});
