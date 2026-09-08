// index.js
// The registry of soft constraints. None of these block anything: they return
// penalties that add up to a score used to compare one candidate roster
// against another. Lower is better.
//
// Same pattern as the hard registry - adding a constraint is one file and one
// line here.

import { scorePreferenceMatch } from './preferenceMatch.js';
import { scorePatternContinuity } from './patternContinuity.js';
import { scoreFairnessDebt } from './fairnessDebt.js';

export const SOFT_CONSTRAINTS = [
  scorePreferenceMatch,
  scorePatternContinuity,
  scoreFairnessDebt,
];

export { scorePreferenceMatch, scorePatternContinuity, scoreFairnessDebt };
