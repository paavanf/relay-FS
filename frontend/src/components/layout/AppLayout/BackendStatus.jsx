// BackendStatus - a small dot showing whether the API is reachable.
// Polls /api/health every 30 seconds.
//
// /api/health answers 503 when the API is up but its database is not, and the
// body still describes that. Treating it as "degraded" rather than "offline"
// keeps a stopped API distinguishable from a missing database.

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
  let dot = 'bg-danger';

  if (isPending) {
    label = 'Checking';
    dot = 'bg-ink-subtle';
  } else if (health) {
    label = health.status === 'ok' ? 'Connected' : 'Database unavailable';
    dot = health.status === 'ok' ? 'bg-success' : 'bg-warning';
  }

  return (
    <div className="flex items-center gap-2 px-0.5 py-1.5 text-xs text-ink-subtle">
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </div>
  );
}
