// TimeLeft - how long a proposed swap has left, in words, derived from its
// stored deadline every time the clock moves on. It re-reads the clock each
// minute, or exactly at the deadline if that comes sooner.
//
// When the time is up it does not decide what happened - the server may
// have committed the swap a moment before - it asks the page to fetch again
// (onTimeUp), once per deadline.
import { useEffect, useRef, useState } from 'react';
import { timeLeft, msUntil } from '../../features/swaps/timeLeft.js';

export function TimeLeft({ expiresAt, onTimeUp }) {
  const [now, setNow] = useState(() => Date.now());
  const toldFor = useRef(null);
  const remaining = msUntil(expiresAt, now);

  useEffect(() => {
    if (remaining > 0) {
      const timer = setTimeout(() => setNow(Date.now()), Math.min(60_000, remaining + 50));
      return () => clearTimeout(timer);
    }
    if (toldFor.current !== expiresAt) {
      toldFor.current = expiresAt;
      onTimeUp?.();
    }
    return undefined;
  }, [remaining, expiresAt, onTimeUp]);

  return (
    <time dateTime={new Date(expiresAt).toISOString()} className="text-body-sm text-content-secondary tabular-nums">
      {timeLeft(expiresAt, now) ?? 'Time is up - checking what happened...'}
    </time>
  );
}
