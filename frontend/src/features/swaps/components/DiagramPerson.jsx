// DiagramPerson - one person in a ChainDiagram: a circle with their
// initials, and their first name beneath. The person looking at their own
// request is filled in solid and named "You", so they can find themselves
// in the chain at a glance.
//
// In a proposed swap each person also shows where they stand - accepted,
// waiting or declined - as a small badge on their circle AND a word under
// their name. Never colour alone: the badge's shape (a tick, a clock, a
// cross) and the word say it too. Initials are set in the display face.

import { NODE_RADIUS, NAME_BELOW, STATE_BELOW } from './chainLayout.js';

const initialsOf = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const STATES = {
  accepted: { word: 'Accepted', tone: 'text-success-content', glyph: 'M -3 0 L -1 2.5 L 3.5 -2.5' },
  waiting: { word: 'Waiting', tone: 'text-warning-content', glyph: 'M 0 -3.5 L 0 0 L 2.5 1.5' },
  declined: { word: 'Declined', tone: 'text-danger-content', glyph: 'M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5' },
};

function StateMark({ place, state }) {
  const look = STATES[state];
  if (!look) return null;

  return (
    <g className={look.tone}>
      <g transform={`translate(${place.x + 17} ${place.y - 17})`}>
        <circle r="7.5" className="fill-surface-raised" stroke="currentColor" strokeWidth="1.5" />
        <path d={look.glyph} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x={place.x} y={place.y + STATE_BELOW} textAnchor="middle" dominantBaseline="middle" className="fill-current text-[10px] font-medium">
        {look.word}
      </text>
    </g>
  );
}

export function DiagramPerson({ person, place, isYou, state }) {
  const name = person.name ?? 'A team member';

  return (
    <g>
      <circle cx={place.x} cy={place.y} r={NODE_RADIUS} stroke="currentColor" strokeWidth="1.5" className={isYou ? 'fill-brand-solid' : 'fill-brand-subtle'} />
      <text
        x={place.x}
        y={place.y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`font-display text-[12px] font-bold ${isYou ? 'fill-content-inverse' : 'fill-brand-content'}`}
      >
        {initialsOf(name)}
      </text>
      <text x={place.x} y={place.y + NAME_BELOW} textAnchor="middle" dominantBaseline="middle" className="fill-content-secondary text-[11px]">
        {isYou ? 'You' : name.split(' ')[0]}
      </text>
      <StateMark place={place} state={state} />
    </g>
  );
}
