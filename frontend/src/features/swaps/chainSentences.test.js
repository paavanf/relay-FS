// chainSentences.test.js
// An option read out as sentences: the requester's shift being taken comes
// first, the chain is followed round, and "you" is used only for the person
// who offered the shift.

import { describe, it, expect } from 'vitest';
import { chainSentences } from './chainSentences.js';

const person = (membershipId, name) => ({ membershipId, name });
const shift = (id, date, name) => ({ id, date, shift: { name } });

const you = person('you', 'Mia Lopez');
const asha = person('asha', 'Asha Patel');
const ravi = person('ravi', 'Ravi Shah');

// As the API lists it: you take Ravi's, Ravi takes Asha's, Asha takes yours.
const chain = {
  size: 3,
  legs: [
    { from: ravi, to: you, assignment: shift('s1', '2026-03-17', 'Evening') },
    { from: asha, to: ravi, assignment: shift('s2', '2026-03-20', 'Day') },
    { from: you, to: asha, assignment: shift('s3', '2026-03-21', 'Night') },
  ],
};

describe('chainSentences', () => {
  it('speaks to the requester, starting with who takes their shift', () => {
    expect(chainSentences(chain, { requesterId: 'you', viewerIsRequester: true })).toEqual([
      'Asha takes your night shift on Saturday 21 March.',
      "You take Ravi's evening shift on Tuesday 17 March.",
      "Ravi takes Asha's day shift on Friday 20 March.",
    ]);
  });

  it("uses names throughout for a manager reading someone else's options", () => {
    expect(chainSentences(chain, { requesterId: 'you', viewerIsRequester: false })[0]).toBe(
      "Asha takes Mia's night shift on Saturday 21 March.",
    );
  });

  it('uses full names when two people share a first name', () => {
    const twin = person('asha2', 'Asha Khan');
    const direct = {
      size: 2,
      legs: [
        { from: twin, to: asha, assignment: shift('t1', '2026-03-18', 'Day') },
        { from: asha, to: twin, assignment: shift('t2', '2026-03-19', 'Night shift') },
      ],
    };

    expect(chainSentences(direct, { requesterId: 'asha', viewerIsRequester: false })).toEqual([
      "Asha Khan takes Asha Patel's night shift on Thursday 19 March.",
      "Asha Patel takes Asha Khan's day shift on Wednesday 18 March.",
    ]);
  });
});
