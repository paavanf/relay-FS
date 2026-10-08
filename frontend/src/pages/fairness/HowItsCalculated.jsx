// HowItsCalculated - the formula in plain words, folded away until asked for.
//
// The numbers in it (the weekend multiplier, the hours a full-time week is
// taken to be, the window length) come from the API's `policy`, so this text
// cannot drift away from what the server actually computes.
import { BALANCED_BAND } from './fairnessWords.js';

export function HowItsCalculated({ policy }) {
  const weeks = Math.round(policy.windowDays / 7);

  return (
    <details className="rounded-lg border border-line-subtle bg-surface-raised">
      <summary className="cursor-pointer rounded-lg px-4 py-3 text-body-sm font-medium text-content-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus">
        How this is calculated
      </summary>

      <ul className="list-disc space-y-2 border-t border-line-subtle py-3 pr-4 pl-8 text-body-sm leading-relaxed text-content-secondary">
        <li>Only published rosters count, from the last {weeks} weeks. Drafts never do.</li>
        <li>
          Each shift weighs what its shift template says, so a night is usually heavier than a day. A
          shift that starts on a Saturday or Sunday counts {policy.weekendMultiplier} times as much.
        </li>
        <li>
          Everyone is compared per full-time week, so a part-timer is not measured against a full-timer's
          total. Where no contracted hours are on file, {policy.referenceHours} hours a week is assumed.
          Someone who joined recently is measured from the day they joined.
        </li>
        <li>
          The team average covers everyone with a contract or at least one shift. Within {BALANCED_BAND}%
          either side of it counts as about the same.
        </li>
        <li>
          When the next roster is generated, anyone carrying more than their share is less likely to be
          given the heaviest shifts.
        </li>
      </ul>
    </details>
  );
}
