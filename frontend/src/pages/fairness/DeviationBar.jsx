// DeviationBar - how far one person sits from the team average: a bar that
// grows right of a centre line for "more", and left of it for "less".
//
// Never colour alone. The bar is only a picture; the signed number and the
// words beside it carry the meaning, so it reads the same in greyscale, in
// either theme, or to a screen reader (which skips the bar entirely).
import { cn } from '../../lib/utils.js';
import { standingOf, standingLabel, formatDeviation } from './fairnessWords.js';

// A bar at full length means this many percent from the average, or more.
const FULL_SCALE = 50;

const COLOURS = { over: 'bg-fair-over', under: 'bg-fair-under', balanced: 'bg-fair-balanced' };

export function DeviationBar({ deviationPercent }) {
  const standing = standingOf(deviationPercent);
  const length = (Math.min(Math.abs(deviationPercent), FULL_SCALE) / FULL_SCALE) * 50;
  const from = deviationPercent >= 0 ? { left: '50%' } : { right: '50%' };

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 w-24 shrink-0 rounded-full bg-surface-sunken" aria-hidden="true">
        {standing === 'balanced' ? (
          <span
            className={cn(
              'absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
              COLOURS.balanced,
            )}
          />
        ) : (
          <span className={cn('absolute inset-y-0 rounded-full', COLOURS[standing])} style={{ ...from, width: `${length}%` }} />
        )}
        <span className="absolute -inset-y-1 left-1/2 w-px bg-line-strong" />
      </div>

      <span className="w-11 shrink-0 text-right text-body-sm font-medium tabular-nums text-content-primary">
        {formatDeviation(deviationPercent)}
      </span>
      <span className="text-body-sm whitespace-nowrap text-content-secondary">{standingLabel(deviationPercent)}</span>
    </div>
  );
}
