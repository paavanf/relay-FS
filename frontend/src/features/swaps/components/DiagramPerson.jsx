// DiagramPerson - one person in a ChainDiagram: a circle with their
// initials, and their first name beneath. The person looking at their own
// request is filled in solid and named "You", so they can find themselves
// in the chain at a glance.

import { NODE_RADIUS, NAME_BELOW } from './chainLayout.js';

const initialsOf = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function DiagramPerson({ person, place, isYou }) {
  const name = person.name ?? 'A team member';

  return (
    <g>
      <circle cx={place.x} cy={place.y} r={NODE_RADIUS} stroke="currentColor" strokeWidth="1.5" className={isYou ? 'fill-brand-solid' : 'fill-brand-subtle'} />
      <text
        x={place.x}
        y={place.y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-[12px] font-semibold ${isYou ? 'fill-content-inverse' : 'fill-brand-content'}`}
      >
        {initialsOf(name)}
      </text>
      <text x={place.x} y={place.y + NAME_BELOW} textAnchor="middle" dominantBaseline="middle" className="fill-content-secondary text-[11px]">
        {isYou ? 'You' : name.split(' ')[0]}
      </text>
    </g>
  );
}
