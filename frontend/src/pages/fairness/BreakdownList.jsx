// BreakdownList - one person's own shifts in the window, by kind.
//
// The label comes first in the markup, so a screen reader hears "Nights: 4";
// flex-col-reverse puts the number on top visually, and justify-end keeps
// every number on one line even when a label wraps.
import { formatHours } from './fairnessWords.js';

const ITEMS = [
  ['Nights', (you) => you.shiftCounts.night],
  ['Evenings', (you) => you.shiftCounts.evening],
  ['Days', (you) => you.shiftCounts.day],
  ['Weekend shifts', (you) => you.shiftCounts.weekend],
  ['Hours', (you) => formatHours(you.hoursWorked)],
];

export function BreakdownList({ you }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
      {ITEMS.map(([label, valueOf]) => (
        <div key={label} className="flex flex-col-reverse justify-end border-t border-line-subtle pt-3">
          <dt className="text-body-sm text-content-secondary">{label}</dt>
          <dd className="text-h2 tabular-nums text-content-primary">{valueOf(you)}</dd>
        </div>
      ))}
    </dl>
  );
}
