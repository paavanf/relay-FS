// useChainActions.js
// Proposing a swap, and acting on one: accept, decline, cancel, approve,
// reject. Whatever the answer - even a refusal, which means the chain moved
// on without us - every swap list is fetched again, so the page shows what
// the server now holds rather than what it assumed.
//
// After a commit the shifts have changed hands, so the roster, My Shifts and
// the fairness figures are fetched again too: every screen shows the new
// owners straight away.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { proposeChain, actOnChain } from '../api/swapChains.js';
import { chainKeys } from './useSwapChains.js';
import { swapKeys } from './useSwapRequests.js';

function useRefreshAfter(orgId) {
  const queryClient = useQueryClient();
  return (chain) => {
    const swapLists = [chainKeys.list(orgId), chainKeys.summary(orgId), chainKeys.notifications(orgId), swapKeys.list(orgId), ['swapOptions', orgId]];
    for (const key of swapLists) queryClient.invalidateQueries({ queryKey: key });
    if (chain?.status === 'committed') {
      for (const key of [['roster', orgId], ['rosters', orgId], ['myShifts', orgId], ['fairness', orgId]]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    }
  };
}

export function useProposeChain(orgId) {
  const refresh = useRefreshAfter(orgId);
  return useMutation({
    mutationFn: ({ swapRequestId, optionKey }) => proposeChain(orgId, { swapRequestId, optionKey }),
    onSettled: (chain) => refresh(chain),
  });
}

/** mutate({ chainId, action, body }) - action is 'accept', 'decline', 'cancel', 'approve' or 'reject'. */
export function useChainAction(orgId) {
  const refresh = useRefreshAfter(orgId);
  return useMutation({
    mutationFn: ({ chainId, action, body }) => actOnChain(orgId, chainId, action, body),
    onSettled: (chain) => refresh(chain),
  });
}
