// Skeleton - a placeholder block with a quiet sweep while data loads.
// The sweep is defined in index.css so reduced-motion can switch it off.
import { cn } from '../../lib/utils.js';

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-sm', className)} />;
}
