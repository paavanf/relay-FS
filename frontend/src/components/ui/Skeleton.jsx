// Skeleton - a grey shimmering block shown while real content loads.
import { cn } from '../../lib/utils.js';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}
