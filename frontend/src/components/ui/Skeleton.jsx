// Skeleton - a translucent block with a light sweep, shown while data loads.
import { cn } from '../../lib/utils.js';

export function Skeleton({ className }) {
  return <div className={cn('shimmer rounded-lg bg-white/6', className)} />;
}
