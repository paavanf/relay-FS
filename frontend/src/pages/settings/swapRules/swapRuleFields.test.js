// swapRuleFields.test.js
// The swap rules form's own check - the same bounds the server enforces -
// and when the form counts as changed.

import { describe, it, expect } from 'vitest';
import { validateSwapRules, swapRulesChanged } from './swapRuleFields.js';

const VALID = { acceptanceWindowHours: 48, requireManagerApproval: true, maxChainLength: 4 };

describe('the swap rules form', () => {
  it('accepts sensible rules', () => {
    expect(validateSwapRules(VALID)).toEqual({});
    expect(validateSwapRules({ acceptanceWindowHours: 1, requireManagerApproval: false, maxChainLength: 2 })).toEqual({});
  });

  it.each([
    [{ acceptanceWindowHours: 0 }, 'acceptanceWindowHours'],
    [{ acceptanceWindowHours: 169 }, 'acceptanceWindowHours'],
    [{ acceptanceWindowHours: Number.NaN }, 'acceptanceWindowHours'],
    [{ requireManagerApproval: 'yes' }, 'requireManagerApproval'],
    [{ maxChainLength: 5 }, 'maxChainLength'],
    [{ maxChainLength: 1 }, 'maxChainLength'],
  ])('refuses %o', (change, field) => {
    expect(Object.keys(validateSwapRules({ ...VALID, ...change }))).toEqual([field]);
  });

  it('counts as changed only when a rule differs from what is saved', () => {
    expect(swapRulesChanged({ ...VALID }, VALID)).toBe(false);
    expect(swapRulesChanged({ ...VALID, maxChainLength: 3 }, VALID)).toBe(true);
    expect(swapRulesChanged(VALID, undefined)).toBe(false);
  });
});
