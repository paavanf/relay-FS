// teamQueries.js
// What to refetch after the team changes. More than the member list goes out
// of date: contracted hours feed the fairness ledger, and a deactivation
// takes shifts off draft rosters, so the schedule views need a fresh look.

export function refreshAfterTeamChange(queryClient, orgId) {
  const stale = [
    ['members', orgId],
    ['fairness', orgId],
    ['rosters', orgId],
    // Every roster of this organisation: ['roster', orgId, rosterId].
    ['roster', orgId],
  ];

  for (const queryKey of stale) {
    queryClient.invalidateQueries({ queryKey });
  }
}
