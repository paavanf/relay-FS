// optionKey.js
// An option's identity, and the sentences that refuse one.
//
// The key is the option's offer ids, rotated to start from the smallest -
// the engine's canonicalKey - so the same chain has the same key however it
// is drawn, and a different set of hand-overs has a different one. The
// options response sends it with every option, and a proposal names the
// option it chose by it.

import { canonicalKey } from '../../engine/index.js';

export const optionKeyOf = (option) => canonicalKey(option.offerIds.map((id) => ({ id })));

// The search is run again when someone proposes, and the option they chose
// is no longer among the answers.
export const OPTIONS_CHANGED = 'These options have changed — search again.';

// A shift saved before Milestone 7.5 records no role, so nobody can tell
// whether whoever takes it holds the role it fills. Published rosters
// cannot be regenerated, so the only honest advice is when it stops.
export const ROLELESS_SHIFT =
  "This shift was created before roles were recorded, so it can't be swapped. Shifts on rosters generated since then can be.";
