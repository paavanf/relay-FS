// useSwapRequests.js
// The open swap offers someone may see, and what they can do to their own:
// offer a shift, change what they would take in return, and withdraw it.
// Every mutation refreshes the list and drops any options already fetched,
// since each can change what everyone's searches find.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSwapRequests, offerShift, updateOffer, withdrawOffer } from '../api/swapRequests.js';

export const swapKeys = {
  list: (orgId) => ['swapRequests', orgId],
  options: (orgId, requestId) => ['swapOptions', orgId, requestId],
};

export function useSwapRequests(orgId) {
  return useQuery({ queryKey: swapKeys.list(orgId), queryFn: () => listSwapRequests(orgId) });
}

/**
 * Someone's own offers - open, or part of a proposed swap - by the shift
 * offered; null until loaded. A manager's list holds everyone's offers;
 * only their own count here.
 */
export function useMyOffersByShift(orgId) {
  const offers = useSwapRequests(orgId);
  const byShift = offers.data ? new Map(offers.data.filter((r) => r.mine).map((r) => [r.assignment?.id, r])) : null;
  return { byShift, error: offers.error };
}

function useRefreshingMutation(orgId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: swapKeys.list(orgId) });
      queryClient.removeQueries({ queryKey: ['swapOptions', orgId] });
    },
  });
}

export function useOfferShift(orgId) {
  return useRefreshingMutation(orgId, (input) => offerShift(orgId, input));
}

export function useUpdateOffer(orgId) {
  return useRefreshingMutation(orgId, ({ requestId, ...changes }) => updateOffer(orgId, requestId, changes));
}

export function useWithdrawOffer(orgId) {
  return useRefreshingMutation(orgId, (requestId) => withdrawOffer(orgId, requestId));
}
