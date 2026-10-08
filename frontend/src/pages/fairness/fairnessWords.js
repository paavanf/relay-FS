// fairnessWords.js
// Turns ledger figures into the plain words the Fairness page shows. Pure.

import { DateTime } from 'luxon';

// Within this many percent either side of the average counts as "about the
// same": a point or two is noise from how the shifts happened to fall.
export const BALANCED_BAND = 5;

/** 'over', 'under' or 'balanced'. */
export function standingOf(deviationPercent) {
  if (deviationPercent > BALANCED_BAND) return 'over';
  if (deviationPercent < -BALANCED_BAND) return 'under';
  return 'balanced';
}

const LABELS = { over: 'More than average', under: 'Less than average', balanced: 'About average' };

export function standingLabel(deviationPercent) {
  return LABELS[standingOf(deviationPercent)];
}

/** "+12%", "−8%", "0%": the sign always shown, with a real minus sign. */
export function formatDeviation(deviationPercent) {
  const rounded = Math.round(deviationPercent);
  if (rounded === 0) return '0%';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`;
}

/** "37.5", "96": whole hours plain, anything else to one decimal place. */
export function formatHours(hours) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

/** "12 weeks", "1 week", "10 days" - how long the window really is. */
export function windowLength(window) {
  if (window.days % 7 !== 0) return `${window.days} days`;
  const weeks = window.days / 7;
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
}

/** "28 Jul – 19 Oct", with years only when the two differ. */
export function formatWindow(window) {
  const start = DateTime.fromISO(window.startDate, { zone: 'utc' });
  const end = DateTime.fromISO(window.endDate, { zone: 'utc' });
  const sameYear = start.year === end.year;
  return `${start.toFormat(sameYear ? 'd LLL' : 'd LLL yyyy')} – ${end.toFormat(sameYear ? 'd LLL' : 'd LLL yyyy')}`;
}

/** "the 4 weeks to 11 Oct" */
function spanOf(window) {
  return `the ${windowLength(window)} to ${DateTime.fromISO(window.endDate, { zone: 'utc' }).toFormat('d LLL')}`;
}

/** The one sentence a worker reads first. */
export function summarySentence(you, window) {
  const span = spanOf(window);
  if (!you?.measured) return `You have no shifts in ${span}, so there is nothing to compare yet.`;

  const standing = standingOf(you.deviationPercent);
  if (standing === 'balanced') return `Over ${span}, you have carried about the same as the team average.`;

  const amount = Math.abs(Math.round(you.deviationPercent));
  return `Over ${span}, you have carried ${amount}% ${standing === 'over' ? 'more' : 'less'} than the team average.`;
}

/** The sentence a worker reads first when the team is too small to compare with. */
export function ownShiftsSentence(you, window) {
  const span = spanOf(window);
  if (!you?.measured) return `You have no shifts in ${span}.`;

  const shifts = `${you.shiftsWorked} ${you.shiftsWorked === 1 ? 'shift' : 'shifts'}`;
  return `Over ${span}, you have worked ${shifts}, ${formatHours(you.hoursWorked)} hours in all.`;
}
