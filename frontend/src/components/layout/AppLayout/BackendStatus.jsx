// BackendStatus - a small dot showing whether the API is reachable.
// Polls /api/health every 30 seconds.
//
// Note: /api/health answers 503 when the API is running but its database is
// down, and the body still describes that. We treat that as "degraded" rather
// than "offline", otherwise you can't tell a stopped API from a missing DB.

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/apiClient.js';
import { cn } from '../../../lib/utils.js';

export function BackendStatus() {
  const { data, error, isPending } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/health'),
    refetchInterval: 30000,
    retry: false,
  });

  const degraded = error?.status === 503 && error.body?.database ? error.body : null;
  const health = data ?? degraded;

  let label = 'API offline';
  let dot = 'bg-rose-400 text-rose-400';

  if (isPending) {
    label = 'Checking API...';
    dot = 'bg-white/40 text-white/40';
  } else if (health) {
    label = `API ${health.status} · db ${health.database}`;
    dot =
      health.status === 'ok'
        ? 'bg-emerald-400 text-emerald-400'
        : 'bg-amber-400 text-amber-400';
  }

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] tracking-wide text-ink-faint">
      {/* halo puts a soft bloom behind the dot using its own text colour. */}
      <span className={cn('halo pulse-dot relative size-1.5 shrink-0 rounded-full', dot)} />
      <span className="truncate">{label}</span>
    </div>
  );
}
