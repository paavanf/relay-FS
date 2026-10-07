// ScenarioFigures - the two harness results side by side.
//
// Same shifts, different headcount. Shown as plain figures with their context
// attached, because a number without its scenario is exactly the kind of
// claim this page refuses to make.
//
// The label comes first in the markup, so a screen reader hears "shifts
// filled with 40 people: 168 of 168"; flex-col-reverse puts the number on top
// visually. justify-end pins it to the top of the cell (in a reversed column
// the end is the top), so both numbers line up even when one label wraps.
function Figure({ value, of, label }) {
  return (
    <div className="flex flex-col-reverse justify-end border-t border-line-strong pt-4">
      <dt className="mt-1 text-body-sm text-content-secondary">{label}</dt>
      <dd className="text-h1 text-content-primary tabular-nums">
        {value} of {of}
      </dd>
    </div>
  );
}

export function ScenarioFigures({ full, short }) {
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      <Figure value={full.filled} of={full.shifts} label={`shifts filled with ${full.people} people`} />
      <Figure
        value={short.filled}
        of={short.shifts}
        label={`filled with ${short.people} people, ${short.unfilled} left empty with the reason recorded`}
      />
    </dl>
  );
}
