// WorkflowStep - one step of "how it works".
//
// A numbered marker with a line joining it to the next step, then the step's
// text and, for some steps, the real component it describes. Nothing here
// moves: the order is the point, and it reads without animation.
//
// The list is an <ol>, which already announces the order, so the visible
// number is hidden from screen readers rather than read twice.
import { StepVisual } from './StepVisual.jsx';

export function WorkflowStep({ number, step, isLast }) {
  return (
    <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 bg-line-subtle"
        />
      )}

      <span
        aria-hidden="true"
        className="relative flex size-8 items-center justify-center rounded-full bg-brand-solid text-body-sm font-medium text-content-inverse tabular-nums"
      >
        {number}
      </span>

      <div className="min-w-0 pt-1">
        <h3 className="text-h3 text-content-primary">{step.title}</h3>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content-secondary">{step.body}</p>
        {step.visual && (
          <div className="mt-4 max-w-md">
            <StepVisual kind={step.visual} />
          </div>
        )}
      </div>
    </li>
  );
}
