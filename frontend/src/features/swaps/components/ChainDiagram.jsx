// ChainDiagram - a swap option as a picture: the people in it around a
// circle, and an arrow for each hand-over, from the person giving a shift to
// the person taking it, labelled with that shift.
//
// The sentences beside it (chainSentences.js) are the accessible version, so
// the SVG is one labelled image and a screen reader is not walked through
// every line. Colours are design tokens - currentColor for the arrows and
// their heads (marker contents take their colour from where they sit, not
// from the line that uses them), fill and stroke classes for the rest - so
// it is right in both themes. No animation. The geometry is chainLayout.js.

import { useId } from 'react';
import { cn } from '../../../lib/utils.js';
import { VIEW_WIDTH, HEAD, placePeople, arrowBetween, frameFor } from './chainLayout.js';
import { DiagramPerson } from './DiagramPerson.jsx';
import { shiftTag } from '../shiftWords.js';

export function ChainDiagram({ option, youId, label, className }) {
  // useId gives ids like ":r1:"; a url(#...) reference wants plain characters.
  const markerId = `swap-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const people = option.legs.map((leg) => leg.to);
  const places = placePeople(people.length);
  const placeOf = (person) => places[people.findIndex((p) => p.membershipId === person.membershipId)];

  const arrows = option.legs.map((leg) => ({ leg, ...arrowBetween(placeOf(leg.from), placeOf(leg.to), people.length) }));
  const frame = frameFor(places, arrows.map((arrow) => arrow.label));

  return (
    <svg
      viewBox={`0 ${frame.y} ${VIEW_WIDTH} ${frame.height}`}
      role="img"
      aria-label={label}
      className={cn('block h-auto w-full text-brand-solid', className)}
    >
      <defs>
        {/* refX 0 puts the head's base on the curve's end; its tip reaches into the gap before the circle. */}
        <marker id={markerId} viewBox="0 0 10 10" refX="0" refY="5" markerWidth={HEAD} markerHeight={HEAD} markerUnits="userSpaceOnUse" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
        </marker>
      </defs>

      {arrows.map(({ leg, path }) => (
        <path key={leg.assignment.id} d={path} fill="none" stroke="currentColor" strokeWidth="1.75" markerEnd={`url(#${markerId})`} />
      ))}

      {people.map((person, i) => (
        <DiagramPerson key={person.membershipId} person={person} place={places[i]} isYou={person.membershipId === youId} />
      ))}

      {/* Labels last, so their halo sits over any line they cross. */}
      {arrows.map(({ leg, label: at }) => (
        <text
          key={leg.assignment.id}
          x={at.x}
          y={at.y}
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="4"
          strokeLinejoin="round"
          style={{ paintOrder: 'stroke' }}
          className="fill-content-primary stroke-surface-raised text-[11px] font-medium"
        >
          {shiftTag(leg.assignment)}
        </text>
      ))}
    </svg>
  );
}
