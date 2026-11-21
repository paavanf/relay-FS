// GenerationResult - what the run produced, in plain language.
//
// Managers care about "did it cover the shifts", not about objective scores.
// The raw numbers are kept for the curious, folded away in a details element
// so they never compete with the answer - the server's own measured duration
// among them, in milliseconds, where the sentence rounds it to seconds.
import { Callout } from '../../../components/ui/Callout.jsx';

// The answer in one sentence - never "every shift is covered" when no
// coverage rule asked for anyone, so there was nothing to cover.
function outcome({ total, filled, holes, seconds }) {
  if (total === 0) return { variant: 'info', text: 'Nothing to fill: no coverage rule asks for anyone on these dates.' };
  if (holes === 0) return { variant: 'success', text: `Every shift is covered - ${filled} filled in ${seconds}s.` };
  return {
    variant: 'warning',
    text: `${filled} of ${total} shifts filled in ${seconds}s. ${holes} could not be covered without breaking a rule - they are listed below.`,
  };
}

export function GenerationResult({ metrics }) {
  const total = metrics?.totalSlots ?? 0;
  const holes = metrics?.unfilledCount ?? 0;
  const seconds = Math.max(1, Math.round((metrics?.durationMs ?? 0) / 1000));
  const { variant, text } = outcome({ total, filled: total - holes, holes, seconds });

  return (
    <div className="space-y-3">
      <Callout variant={variant}>{text}</Callout>

      <details className="text-body-sm text-content-secondary">
        <summary className="cursor-pointer text-content-tertiary">Technical details</summary>

        <dl className="mt-2 space-y-1">
          {[
            ['Objective score', Math.round(metrics?.objectiveScore ?? 0)],
            ['Search iterations', metrics?.iterations ?? 0],
            ['Improvements found', metrics?.improvementSteps ?? 0],
            ['Fairness variance', metrics?.fairnessVariance ?? 0],
            ['Duration', `${metrics?.durationMs ?? 0} ms`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt>{label}</dt>
              <dd className="data text-content-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
