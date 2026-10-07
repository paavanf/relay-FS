// HeroRosterDemo - the real roster grid, filling with real engine output.
//
// This is Relay's own RosterGrid, the component managers use on the Schedule
// page, rendered from fixture data instead of the API. The shifts are the
// generator's actual output for a sample cafe (see ../fixtures/index.js) and
// appear in the order the generator placed them.
//
// Shifts not yet placed are passed as unfilled slots so each day's Coverage
// cell keeps counting against the real requirement: it reads short, then
// complete, exactly as it would on a live roster.
import { RosterGrid } from '../../schedule/grid/index.js';
import { cafe } from '../fixtures/index.js';
import { useFillAnimation } from './useFillAnimation.js';
import { useInView } from '../../../hooks/useInView.js';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion.js';

const noop = () => {};

export function HeroRosterDemo() {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const reducedMotion = usePrefersReducedMotion();

  const total = cafe.assignments.length;
  const shown = useFillAnimation(total, { running: inView, instant: reducedMotion });

  const placed = cafe.assignments.slice(0, shown);
  const pending = cafe.assignments.slice(shown).map((a) => ({ slotId: a.id, date: a.date }));

  return (
    <figure ref={ref}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-label text-content-secondary">Sample roster</p>
        <p className="text-body-sm text-content-tertiary tabular-nums" aria-hidden="true">
          {shown < total ? `Placing shifts: ${shown} of ${total}` : `All ${total} shifts filled`}
        </p>
      </div>

      <RosterGrid
        roster={cafe.roster}
        assignments={placed}
        unfilledSlots={pending}
        members={cafe.members}
        templates={cafe.templates}
        canEdit={false}
        onCellClick={noop}
      />

      <figcaption className="mt-3 max-w-3xl text-body-sm leading-relaxed text-content-tertiary">
        Real output from Relay&apos;s generator for a sample cafe: {cafe.totals.people} people, one
        week, {cafe.totals.shifts} shifts, two people on each day and evening shift. The Coverage
        row counts shifts filled against shifts needed for each day.
      </figcaption>
    </figure>
  );
}
