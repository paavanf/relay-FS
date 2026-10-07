// useFillAnimation - how many of the roster's shifts are on the grid so far.
//
// Counts from 0 up to `total`, one shift per step, once `running` turns true.
// Each step schedules the next with a timeout rather than an interval, so it
// stops by itself at the end and is cleaned up if the page unmounts midway.
//
// With `instant` (reduced motion) it reports the finished state from the very
// first render: the full grid tells the same story without the movement.
import { useEffect, useState } from 'react';

export function useFillAnimation(total, { running, instant, stepMs = 70 }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (instant || !running || shown >= total) return undefined;

    const timer = setTimeout(() => setShown((n) => Math.min(total, n + 1)), stepMs);
    return () => clearTimeout(timer);
  }, [instant, running, shown, total, stepMs]);

  return instant ? total : shown;
}
