// 07-swap-options.spec.js
// Milestone 7: finding swaps in the demo data, as the people involved see it.
//
//   the chain     the request only a chain can resolve shows a chain of three,
//                 in sentences and as a diagram whose arrows stop short of
//                 every circle - and no direct swap
//   the direct    a request with a direct swap shows it before any chain
//   no options    says why in plain words, and that new offers can change it
//   a manager     sees every open request, worded with names, not "you" -
//                 and cannot propose someone else's swap
// Read-only, so these run before the specs that change data. Each answer is
// captured in both themes at both widths: e2e/artifacts/screenshots/swap-*.png.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { manager } from '../support/people.js';
import { PHONE } from '../support/session.js';
import { captureAll } from '../support/screens.js';
import { findSwapCases, findSwapsForMyOffer, diagramGeometry, arrowProblems, firstOption, escapeRegExp, shiftTitleOf } from '../support/swaps.js';

let cases;
test.beforeAll(async () => {
  cases = await findSwapCases();
});

test('the request only a chain resolves shows a three-person chain, drawn and in words', async ({ sessions }) => {
  expect(cases.chain, 'the demo has a request only a chain resolves').toBeDefined();
  const { page } = await sessions.open(cases.chain.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, cases.chain.request);

  await expect(page.getByRole('heading', { level: 2, name: /^Swaps for your / })).toBeVisible();
  const card = firstOption(page, 'Swap chains');
  await expect(card).toBeVisible();
  await expect(page.getByRole('region', { name: 'Direct swaps' })).toHaveCount(0);

  const sentences = card.getByRole('listitem');
  await expect(sentences).toHaveCount(3);
  await expect(sentences.nth(0)).toHaveText(/^\S+ takes your .+ shift on .+\.$/);
  await expect(sentences.nth(1)).toHaveText(/^You take \S+'s .+ shift on .+\.$/);
  await expect(card.getByText(/^Three people\./)).toBeVisible();
  await expect(card.getByRole('button', { name: 'Propose this swap' })).toBeEnabled();
  await expect(card.getByText('Everyone else in it is asked to accept. Looking reserves nothing.')).toBeVisible();

  // The arrows as the browser drew them stop short of every circle.
  const geometry = await diagramGeometry(card.getByRole('img', { name: /^Diagram of a 3-person swap chain between / }));
  expect(geometry.orient).toBe('auto');
  expect([geometry.circles.length, geometry.arrows.length]).toEqual([3, 3]);
  expect(arrowProblems(geometry)).toEqual([]);

  await page.setViewportSize(PHONE);
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(widths[0], 'no sideways scroll with the chain open at 375px').toBeLessThanOrEqual(widths[1]);
  await captureAll(page, 'swap-chain', { target: card });
});

test('a request with a direct swap shows it before any chain', async ({ sessions }) => {
  expect(cases.direct, 'the demo has a request with a direct swap').toBeDefined();
  const { page } = await sessions.open(cases.direct.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, cases.direct.request);

  const card = firstOption(page, 'Direct swaps');
  await expect(card.getByText(/^A direct swap, so only two people need to agree\./)).toBeVisible();
  await expect(card.getByRole('img', { name: /^Diagram of a direct swap between / })).toBeVisible();

  const directFirst = await page.evaluate(() => {
    const [direct, chains] = ['Direct swaps', 'Swap chains'].map((name) => document.querySelector(`[aria-label="${name}"]`));
    return !chains || Boolean(direct.compareDocumentPosition(chains) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(directFirst, 'direct swaps come first').toBe(true);
  await captureAll(page, 'swap-direct', { target: card });
});

test('a request with no options says why, and that it may change', async ({ sessions }) => {
  expect(cases.none, 'the demo has a request with no options').toBeDefined();
  const { page } = await sessions.open(cases.none.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, cases.none.request);

  await expect(page.getByRole('heading', { name: 'No swaps found yet' })).toBeVisible();
  await expect(page.getByText(cases.none.options.noMatch.summary, { exact: true })).toBeVisible();
  expect(cases.none.options.noMatch.summary).toMatch(/^\d+ offers? checked: .+\.$/);
  await expect(page.getByText('New options can appear as more people offer shifts, so it is worth looking again later.')).toBeVisible();
  await captureAll(page, 'swap-no-options');
});

test('a manager sees every open offer, and reads options with names', async ({ sessions }) => {
  const { page } = await sessions.open(manager, { path: appPath('swaps') });
  const everyones = page.getByRole('region', { name: "Everyone's open offers" });
  // Named by person and shift, since one person may offer two.
  const findButton = (request) => everyones.getByRole('button', { name: `Find swaps: ${request.requester.name}, ${shiftTitleOf(request.assignment)}` });
  for (const { request } of [cases.chain, cases.direct, cases.none, cases.role]) await expect(findButton(request)).toBeVisible();

  await findButton(cases.chain.request).click();
  const name = escapeRegExp(cases.chain.request.requester.name);
  await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^Swaps for ${name}'s `) })).toBeVisible();
  const sentences = firstOption(page, 'Swap chains').getByRole('listitem');
  await expect(sentences).toHaveCount(3);
  await expect(sentences.filter({ hasText: /\b(you|your|You)\b/ })).toHaveCount(0);
  await expect(firstOption(page, 'Swap chains').getByRole('button', { name: 'Propose this swap' })).toHaveCount(0);
});
