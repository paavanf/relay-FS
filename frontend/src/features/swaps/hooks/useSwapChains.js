// useSwapChains.js
// The proposed swaps someone can see, their notifications, and the counts
// behind the sidebar badges - all kept fresh by asking again rather than
// guessing.
//
// While the Swaps page is open its chains and notifications are fetched
// every 15 seconds and whenever the window regains focus; leaving the page
// unmounts the queries, which stops the polling. The sidebar's counts ask
// less often, since they only decide whether a badge shows.

import { useQuery } from '@tanstack/react-query';
import { listChains, chainSummary, listNotifications, chainImpact } from '../api/swapChains.js';
import { getSwapRules } from '../../organisation/api/swapRules.js';

export const chainKeys = {
  list: (orgId) => ['swapChains', orgId],
  summary: (orgId) => ['swapChainSummary', orgId],
  impact: (orgId, chainId) => ['swapChainImpact', orgId, chainId],
  notifications: (orgId) => ['notifications', orgId],
  rules: (orgId) => ['swapRules', orgId],
};

const LIVE = { refetchInterval: 15_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, staleTime: 5_000 };

export function useSwapChains(orgId) {
  return useQuery({ queryKey: chainKeys.list(orgId), queryFn: () => listChains(orgId), ...LIVE });
}

export function useNotifications(orgId) {
  return useQuery({ queryKey: chainKeys.notifications(orgId), queryFn: () => listNotifications(orgId), ...LIVE });
}

export function useChainSummary(orgId) {
  return useQuery({ queryKey: chainKeys.summary(orgId), queryFn: () => chainSummary(orgId), refetchInterval: 60_000 });
}

export function useChainImpact(orgId, chainId) {
  return useQuery({ queryKey: chainKeys.impact(orgId, chainId), queryFn: () => chainImpact(orgId, chainId), retry: false });
}

export function useSwapRules(orgId) {
  return useQuery({ queryKey: chainKeys.rules(orgId), queryFn: () => getSwapRules(orgId) });
}
