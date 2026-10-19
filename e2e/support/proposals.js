// proposals.js
// The demo's proposed swaps (Milestone 8), found the way a manager would see
// them - through the real API - since the seed picks their people with the
// engine and the suite never hard-codes names:
//
//   waiting    proposed, and waiting for its second person to accept
//   approval   accepted by both, and waiting for a manager
//
// Each comes back with the people in it as sign-in accounts.

import { apiAs } from './api.js';
import { stack } from './stack.js';
import { manager, everyone } from './people.js';

const accountOf = (participant) => everyone.find((p) => p.name === participant.name);

/** { waiting, approval } - each { chain, people } with people in chain order; null if there is none. */
export async function findSeededProposals() {
  const api = await apiAs(manager);
  const { chains } = (await api.get(`/orgs/${stack().orgId}/swap-chains`)).body;
  await api.dispose();

  const seeded = (status) => chains.find((chain) => chain.status === status && chain.size === 2);
  const withPeople = (chain) => (chain ? { chain, people: chain.participants.map(accountOf) } : null);
  return { waiting: withPeople(seeded('proposed')), approval: withPeople(seeded('awaiting_approval')) };
}

/** The account that has still to answer a chain. */
export const stillToAnswer = ({ chain, people }) => people[chain.participants.findIndex((p) => p.state === 'waiting')];
