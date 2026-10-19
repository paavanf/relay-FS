// chainWords.js
// How a proposed swap is talked about on the page:
//
//   STATUS_WORDS  a short status for its badge - named for what it means,
//                 like the Badge variants it uses
//   howItEnded    once it has ended, one sentence saying how: who declined,
//                 who approved, or why it could not be completed
//   diagramLabel  the one label its diagram carries for screen readers
//                 (the sentences beside it say the rest)

export const STATUS_WORDS = {
  proposed: { label: 'Waiting for everyone to accept', variant: 'brand' },
  awaiting_approval: { label: 'Waiting for a manager', variant: 'info' },
  committed: { label: 'Done', variant: 'success' },
  declined: { label: 'Declined', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  expired: { label: 'Expired', variant: 'neutral' },
  failed: { label: 'Could not be completed', variant: 'danger' },
};

export function howItEnded(chain) {
  const by = chain.endedBy?.by?.name;
  switch (chain.status) {
    case 'committed':
      return chain.endedBy?.action === 'approve' && by ? `Done - approved by ${by}.` : 'Done - everyone accepted.';
    case 'declined':
      if (chain.endedBy?.action !== 'reject') return `Declined by ${by ?? 'someone in it'}. Nothing changed.`;
      return chain.rejectionReason ? `Rejected by ${by ?? 'a manager'}: ${chain.rejectionReason}` : `Rejected by ${by ?? 'a manager'}.`;
    case 'cancelled':
      return `Cancelled by ${by ?? 'the person who proposed it'}. Nothing changed.`;
    case 'expired':
      return 'Ran out of time before it was completed. Nothing changed.';
    case 'failed':
      return `Could not be completed: ${chain.failureReason ?? 'something changed.'} Nothing changed.`;
    default:
      return null;
  }
}

export function diagramLabel(option) {
  const names = option.legs.map((leg) => leg.to.name);
  return option.size === 2
    ? `Diagram of a direct swap between ${names.join(' and ')}`
    : `Diagram of a ${option.size}-person swap chain between ${names.join(', ')}`;
}
