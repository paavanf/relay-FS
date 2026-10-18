// useSwapOptions.js
// The options for one swap request, fetched only once someone asks (a
// request id is chosen). The search is the expensive call the server rate
// limits, so a result is reused for half a minute rather than refetched on
// every focus; "Search again" asks for a fresh one.

import { useQuery } from '@tanstack/react-query';
import { getSwapOptions } from '../api/swapRequests.js';
import { swapKeys } from './useSwapRequests.js';

export function useSwapOptions(orgId, requestId) {
  return useQuery({
    queryKey: swapKeys.options(orgId, requestId),
    queryFn: () => getSwapOptions(orgId, requestId),
    enabled: Boolean(requestId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
