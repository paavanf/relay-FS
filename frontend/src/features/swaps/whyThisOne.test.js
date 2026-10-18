// whyThisOne.test.js
// The "why this one" line says what the score says, and nothing more.

import { describe, it, expect } from 'vitest';
import { whyThisOne } from './whyThisOne.js';

describe('whyThisOne', () => {
  it('describes a plain three-person chain', () => {
    expect(whyThisOne({ people: 3, avoided: 0, preferred: 0, fairnessGain: 0 })).toBe(
      'Three people. Nobody gets a shift they marked avoid.',
    );
  });

  it('says a direct swap needs only two people to agree', () => {
    expect(whyThisOne({ people: 2, avoided: 0, preferred: 0, fairnessGain: 0 })).toMatch(
      /^A direct swap, so only two people need to agree\./,
    );
  });

  it('owns up to an avoided shift, and reports wishes and fairness', () => {
    expect(whyThisOne({ people: 4, avoided: 1, preferred: 2, fairnessGain: 1.6 })).toBe(
      'Four people. One hand-over is onto a shift someone marked avoid. 2 people get shifts they asked for. ' +
        'It moves burden toward someone carrying less than their share.',
    );
  });

  it('says so when burden moves toward someone already over their share', () => {
    expect(whyThisOne({ people: 2, avoided: 0, preferred: 0, fairnessGain: -0.5 })).toMatch(
      /already carrying more than their share\.$/,
    );
  });
});
