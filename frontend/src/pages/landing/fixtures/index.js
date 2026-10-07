// fixtures/index.js
// Real roster-engine output for the landing page's demonstrations.
//
// engineOutput.json is NOT hand-written. It is produced by
// backend/scripts/export-landing-fixture.js, which runs Relay's generator on
// the fixed scenarios in backend/scripts/scenarios.js - the same seed and
// search budget `npm run evaluate` uses - and writes what comes out. Every
// shift in the demo grid, every "this breaks minimum rest" verdict and every
// unfilled-shift reason is genuine engine output. Only the cafe members'
// display names were added.
//
// To regenerate after an engine change:
//   cd backend && node scripts/export-landing-fixture.js
//
// The landing page renders straight from this file and makes no network
// requests.

import engineOutput from './engineOutput.json';

// One week at a sample 8-person cafe: the roster the hero grid fills with.
export const cafe = engineOutput.cafe;

// A 40-person, 14-day ward the generator fills completely.
export const ward = engineOutput.ward;

// The same ward with 12 people: the shifts it refused to fill, and why.
export const understaffed = engineOutput.understaffed;

// The working-time limits a new organisation starts with.
export const defaultRosterRules = engineOutput.defaultRosterRules;
