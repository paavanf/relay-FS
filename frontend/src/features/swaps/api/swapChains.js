// swapChains.js
// API calls for proposed swaps (Milestone 8): proposing one of the options
// found for an offer, the people in it answering, a manager deciding, the
// approval preview, and the counts behind the sidebar badges.
//
// Every status change happens on the server through its state machine; the
// page only asks. A refused answer (409) carries details.reason, so the page
// can tell "expired" from "declined" without reading the sentence.

import { api } from '../../../lib/apiClient.js';

/** Proposes the option with this key for one of your offers. Returns the new chain. */
export async function proposeChain(orgId, { swapRequestId, optionKey }) {
  const result = await api.post(`/orgs/${orgId}/swap-chains`, { swapRequestId, optionKey });
  return result.chain;
}

/** The chains you are in - a manager's list holds every chain in the organisation. */
export async function listChains(orgId) {
  const result = await api.get(`/orgs/${orgId}/swap-chains`);
  return result.chains;
}

/** { waitingForYou, awaitingApproval } - the second only for managers. */
export function chainSummary(orgId) {
  return api.get(`/orgs/${orgId}/swap-chains/summary`);
}

/** 'accept', 'decline' or 'cancel' for the people in it; 'approve' or 'reject' for a manager. */
export async function actOnChain(orgId, chainId, action, body = {}) {
  const result = await api.post(`/orgs/${orgId}/swap-chains/${chainId}/${action}`, body);
  return result.chain;
}

/** { coverage, fairness, rules } - what approving would change (managers only). */
export function chainImpact(orgId, chainId) {
  return api.get(`/orgs/${orgId}/swap-chains/${chainId}/impact`);
}

/** Your own notifications, newest first. */
export async function listNotifications(orgId) {
  const result = await api.get(`/orgs/${orgId}/notifications`);
  return result.notifications;
}
