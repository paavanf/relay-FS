// chainSections.js
// The Swaps page's three lists of proposed swaps, for the person looking:
//
//   waiting     proposals they have not answered - first, and soonest
//               deadline first, because these are the ones a phone buzzes for
//   proposals   swaps they are in that are still going: ones they proposed,
//               and ones they accepted, waiting on others or a manager
//   history     swaps that have ended - done, declined, cancelled, expired
//               or failed - newest first
//
// Only chains they are in. A manager's list holds everyone's; the approvals
// page is where those are decided.

const LIVE = ['proposed', 'awaiting_approval'];

const soonestFirst = (a, b) => new Date(a.expiresAt) - new Date(b.expiresAt);
const newestFirst = (a, b) => new Date(b.endedAt ?? b.createdAt) - new Date(a.endedAt ?? a.createdAt);

export const isLive = (chain) => LIVE.includes(chain.status);

/** Can the person looking do anything with it now - answer it, or cancel their own proposal? */
export const canActOn = (chain) => chain.waitingForYou || (chain.youProposed && isLive(chain));

/** { waiting, proposals, history } - each a list of chains. */
export function chainSections(chains) {
  const mine = chains.filter((chain) => chain.youAreIn);
  return {
    waiting: mine.filter((chain) => chain.waitingForYou).sort(soonestFirst),
    proposals: mine.filter((chain) => isLive(chain) && !chain.waitingForYou).sort(soonestFirst),
    history: mine.filter((chain) => !isLive(chain)).sort(newestFirst),
  };
}
