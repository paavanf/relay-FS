// SwapCycleMark - the static illustration on the auth brand panel.
//
// It draws what Relay actually does: three people in a covering cycle, where
// each takes the next person's shift. Deliberately specific to scheduling
// rather than an abstract shape, and deliberately still - no animation.

const people = [
  { cx: 110, cy: 34, label: 'Mon' },
  { cx: 186, cy: 166, label: 'Wed' },
  { cx: 34, cy: 166, label: 'Fri' },
];

export function SwapCycleMark() {
  return (
    <svg viewBox="0 0 220 200" fill="none" className="w-full max-w-[260px]" role="img"
      aria-label="Three shifts covering each other in a cycle">
      {/* The cycle the three shifts form. */}
      <path
        d="M110 34 L186 166 L34 166 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="text-brand-600/30"
      />

      {/* Direction of cover, marked once so the loop reads as a rotation. */}
      <path
        d="M150 104 l6 -3 -1 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-600/60"
      />

      {people.map((person) => (
        <g key={person.label}>
          <circle cx={person.cx} cy={person.cy} r="17" className="fill-brand-50" />
          <circle
            cx={person.cx}
            cy={person.cy}
            r="17"
            className="stroke-brand-600/35"
            strokeWidth="1.25"
            fill="none"
          />
          <text
            x={person.cx}
            y={person.cy + 4}
            textAnchor="middle"
            className="fill-brand-700 text-[11px] font-medium"
          >
            {person.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
