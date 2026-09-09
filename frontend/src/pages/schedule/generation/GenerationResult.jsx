// GenerationResult - what the run produced, in plain language.
//
// Managers care about "did it cover the shifts", not about objective scores.
// The raw numbers are kept for the curious, folded away in a details element
// so they never compete with the answer.
import { Callout } from '../../../components/ui/Callout.jsx';

export function GenerationResult({ metrics }) {
  const filled = (metrics?.totalSlots ?? 0) - (metrics?.unfilledCount ?? 0);
  const seconds = Math.max(1, Math.round((metrics?.durationMs ?? 0) / 1000));
  const holes = metrics?.unfilledCount ?? 0;

  return (
    <div className="space-y-3">
      <Callout variant={holes === 0 ? 'success' : 'warning'}>
        {holes === 0
          ? `Every shift is covered - ${filled} filled in ${seconds}s.`
          : `${filled} of ${metrics?.totalSlots ?? 0} shifts filled in ${seconds}s. ${holes} could not be covered without breaking a rule - they are listed below.`}
      </Callout>

      <details className="text-body-sm text-content-secondary">
        <summary className="cursor-pointer text-content-tertiary">Technical details</summary>

        <dl className="mt-2 space-y-1">
          {[
            ['Objective score', Math.round(metrics?.objectiveScore ?? 0)],
            ['Search iterations', metrics?.iterations ?? 0],
            ['Improvements found', metrics?.improvementSteps ?? 0],
            ['Fairness variance', metrics?.fairnessVariance ?? 0],
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
