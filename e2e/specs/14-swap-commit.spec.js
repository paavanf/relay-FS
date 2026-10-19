// 14-swap-commit.spec.js
// Milestone 8: a swap from proposal to done, each person in a browser of
// their own:
//
//   Dara proposes the demo's three-person chain from its option, and it
//   becomes her proposal - with where everyone stands on it
//   the other two accept it, the first on a phone
//   the manager reads what approving would change, and approves
//   all three then find the shift they took on My Shifts, and the one they
//   gave gone
//
// Changes data - three shifts change hands - so it runs after the rest.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { manager, everyone } from '../support/people.js';
import { PHONE } from '../support/session.js';
import { captureAll } from '../support/screens.js';
import { findSwapCases, findSwapsForMyOffer, firstOption, shiftTitleOf } from '../support/swaps.js';

let chainCase;
test.beforeAll(async () => {
  chainCase = (await findSwapCases()).chain;
});

const accountOf = (person) => everyone.find((p) => p.name === person.name);
const cardIn = (scope, proposer) => scope.getByRole('listitem', { name: `Swap proposed by ${proposer.name}` });
const offerButton = (page, shift) => page.getByRole('button', { name: `Offer this shift: ${shiftTitleOf(shift)}` });

test("a three-person swap: proposed, accepted, approved - and everyone's My Shifts shows it", async ({ sessions }) => {
  const { request, person: dara, options } = chainCase;
  const option = options.chains[0];
  const others = option.legs.map((leg) => leg.to).filter((p) => p.membershipId !== request.requester.membershipId);

  // Dara proposes it, from its option.
  const { page: daras } = await sessions.open(dara, { path: appPath('swaps') });
  await findSwapsForMyOffer(daras, request);
  await firstOption(daras, 'Swap chains').getByRole('button', { name: 'Propose this swap' }).click();
  const dialog = daras.getByRole('dialog');
  await expect(dialog.getByText(/^If not everyone has accepted by .+, the proposal ends and nothing changes\.$/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Propose swap' }).click();

  const proposal = cardIn(daras.getByRole('region', { name: 'Your proposals' }), dara);
  const stands = proposal.getByRole('list', { name: 'Where everyone stands' });
  await expect(stands).toContainText('You - Accepted');
  await expect(stands.getByText('- Waiting')).toHaveCount(2);
  await expect(proposal.getByRole('img', { name: /^Diagram of a 3-person swap chain/ })).toBeVisible();

  // The other two accept - the first on a phone, where most people will.
  for (const [i, other] of others.entries()) {
    const { page } = await sessions.open(accountOf(other), { path: appPath('swaps'), viewport: i === 0 ? PHONE : undefined });
    const waiting = cardIn(page.getByRole('region', { name: 'Waiting for you' }), dara);
    if (i === 0) await captureAll(page, 'swap-waiting-for-you', { target: waiting });
    await waiting.getByRole('button', { name: 'Accept' }).click();
    await expect(cardIn(page.getByRole('region', { name: 'Your proposals' }), dara)).toBeVisible();
  }

  // The manager sees what approving would change, then approves.
  const { page: managers } = await sessions.open(manager, { path: appPath('swaps/approvals') });
  const queued = cardIn(managers, dara);
  await expect(queued.getByRole('region', { name: 'Coverage' })).toContainText('Coverage unchanged');
  await expect(queued.getByRole('region', { name: 'Rule check' }).getByText(/No rule broken\./)).toHaveCount(3);
  await expect(queued.getByRole('region', { name: 'Fairness' })).toContainText('Before:');
  await captureAll(managers, 'swap-approval', { target: queued });
  await queued.getByRole('button', { name: 'Approve swap' }).click();
  await expect(cardIn(managers, dara)).toHaveCount(0);

  // Everyone finds the shift they took - offerable, so theirs - and not the one they gave.
  for (const leg of option.legs) {
    const { page } = await sessions.open(accountOf(leg.to), { path: appPath('my-shifts') });
    await expect(offerButton(page, leg.assignment)).toBeVisible();
    const gave = option.legs.find((l) => l.from.membershipId === leg.to.membershipId).assignment;
    await expect(offerButton(page, gave)).toHaveCount(0);
    await expect(page.getByText('In a proposed swap')).toHaveCount(0);
  }
});
