// 14-swap-endings.spec.js
// Milestone 8: the two ways a proposed swap ends without happening, on the
// demo's seeded proposals (support/proposals.js):
//
//   declined   the person it waits for declines, on a phone: it moves to
//              History for both of them, the proposer is told under the
//              bell, and both offers are open again
//   expired    its deadline passes - moved into the past in the test
//              database rather than waited for - and the next look expires
//              it: the manager's queue drops it, and the people in it see
//              that it ran out of time
//
// Changes data, so it runs after the read-only specs.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { PHONE } from '../support/session.js';
import { expireChainNow } from '../support/database.js';
import { findSeededProposals, stillToAnswer } from '../support/proposals.js';
import { shiftTitleOf } from '../support/swaps.js';

let seeded;
test.beforeAll(async () => {
  seeded = await findSeededProposals();
});

const cardIn = (scope, chain) => scope.getByRole('listitem', { name: `Swap proposed by ${chain.proposer.name}` });

test('declined: the swap is off for both of them, and their offers are open again', async ({ sessions }) => {
  expect(seeded.waiting, 'the demo has a proposal waiting for acceptance').not.toBeNull();
  const { chain, people } = seeded.waiting;
  const decider = stillToAnswer(seeded.waiting);
  const proposer = people.find((person) => person !== decider);
  const ended = `Declined by ${decider.name}. Nothing changed.`;

  const { page } = await sessions.open(decider, { path: appPath('swaps'), viewport: PHONE });
  await cardIn(page.getByRole('region', { name: 'Waiting for you' }), chain).getByRole('button', { name: 'Decline' }).click();
  await expect(page.getByRole('region', { name: 'History' }).getByText(ended)).toBeVisible();
  const decidersShift = chain.participants.find((p) => p.name === decider.name).gives;
  await expect(page.getByRole('button', { name: `Find swaps: ${shiftTitleOf(decidersShift)}` })).toBeVisible();

  const { page: theirs } = await sessions.open(proposer, { path: appPath('swaps') });
  await expect(theirs.getByRole('region', { name: 'History' }).getByText(ended)).toBeVisible();
  await theirs.goto(appPath('notifications'));
  await expect(theirs.getByText(`${decider.name} declined your swap proposal, so it is off. Your offer is open again.`)).toBeVisible();
});

test('expired: past its deadline, it leaves the queue and says it ran out of time', async ({ sessions }) => {
  expect(seeded.approval, 'the demo has a proposal waiting for approval').not.toBeNull();
  const { chain, people } = seeded.approval;
  expireChainNow(chain.id);

  const { page } = await sessions.open(manager, { path: appPath('swaps/approvals') });
  await expect(page.getByText('Nothing to approve').or(page.getByRole('list', { name: 'Swaps waiting for approval' }))).toBeVisible();
  await expect(cardIn(page, chain)).toHaveCount(0);

  const { page: theirs } = await sessions.open(people[0], { path: appPath('swaps') });
  const history = theirs.getByRole('region', { name: 'History' });
  await expect(cardIn(history, chain).getByText('Ran out of time before it was completed. Nothing changed.')).toBeVisible();
});
