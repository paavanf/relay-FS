// ScenarioFigures - the two headline numbers of the unfilled-shifts story:
// the 40-person run that filled every shift, and the 12-person run that left
// some empty rather than break a rule. Both are generated test scenarios
// from the evaluation harness (the section says so), never invented.
//
// Each figure is large, in the display face, with a status edge on top:
// success for "every shift filled", danger for "some left empty".
import { cn } from '../../../lib/utils.js';

function Figure({ value, of, label, tone }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse justify-end border-t-4 pt-4',
        tone === 'danger' ? 'border-danger-solid' : 'border-success-solid',
      )}
    >
      <dt className="mt-1 text-body-sm text-content-secondary">{label}</dt>
      <dd className="flex items-baseline gap-2">
        <span className="font-display text-stat text-content-primary tabular-nums">{value}</span>
        <span className="text-body text-content-secondary tabular-nums">of {of}</span>
      </dd>
    </div>
  );
}

export function ScenarioFigures({ full, short }) {
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      <Figure
        value={full.filled}
        of={full.shifts}
        label={`shifts filled with ${full.people} people`}
        tone={full.filled === full.shifts ? 'success' : 'danger'}
      />
      <Figure
        value={short.filled}
        of={short.shifts}
        label={`filled with ${short.people} people, ${short.unfilled} left empty with the reason recorded`}
        tone={short.unfilled > 0 ? 'danger' : 'success'}
      />
    </dl>
  );
}
