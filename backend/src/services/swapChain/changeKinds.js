// changeKinds.js
// What happened to a swap chain, from the event the state machine applied
// and where the chain ended up - the words both its audit entries and its
// notifications are written from.
//
// The last acceptance on a chain that needs approval is two things - an
// acceptance, then a wait for a manager - and an approval is two as well:
// approved, then committed.

export function kindsOf(applied, chain) {
  switch (applied) {
    case 'propose':
      return ['proposed'];
    case 'accept':
      return chain.status === 'awaiting_approval' ? ['accepted', 'awaiting_approval'] : ['accepted'];
    case 'decline':
      return ['declined'];
    case 'cancel':
      return ['cancelled'];
    case 'reject':
      return ['rejected'];
    case 'expire':
      return ['expired'];
    case 'commitFailed':
      return ['failed'];
    case 'committed':
      return chain.endedBy?.action === 'approve' ? ['approved', 'committed'] : ['committed'];
    default:
      return [];
  }
}
