// 07-swap-roles.spec.js
// Milestone 7.5 in the demo data: what an offer would take in return, and the
// roles shifts fill.
//
//   the choosy offer   says what its owner would take ("Would take: Day
//                      shifts"), and is left with only a three-person chain
//   the role refusal   a charge nurse's shift that nobody else offering could
//                      take: no options, and the reason says exactly that
//
// Read-only, like 07-swap-options, so both run before anything changes data.
// Widening the choosy offer is in 08, among the specs that change data.

import { test, expect } from '../support/test.js';
import { appPath } from '../support/stack.js';
import { captureAll } from '../support/screens.js';
import { findSwapCases, findSwapsForMyOffer, firstOption } from '../support/swaps.js';

let cases;
test.beforeAll(async () => {
  cases = await findSwapCases();
});

const shiftsLike = (category) => `${category.charAt(0).toUpperCase()}${category.slice(1)} shifts`;

test('an offer that will only take some shifts says so, and is left with only a chain', async ({ sessions }) => {
  const { request, person } = cases.chain;
  const [only] = request.acceptableShiftFilters.categories;
  expect(only, 'the chain case is an offer that narrowed what it would take').toBeDefined();

  const { page } = await sessions.open(person, { path: appPath('swaps') });
  await expect(page.getByRole('region', { name: 'My offers' }).getByText(`Would take: ${shiftsLike(only)}`)).toBeVisible();

  await findSwapsForMyOffer(page, request);
  await expect(firstOption(page, 'Swap chains')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Direct swaps' })).toHaveCount(0);
});

test("a charge nurse's shift nobody else offering could take: no options, and the reason says so", async ({ sessions }) => {
  expect(cases.role, 'the demo has a shift only its role holders could take').toBeDefined();
  const { page } = await sessions.open(cases.role.person, { path: appPath('swaps') });
  await findSwapsForMyOffer(page, cases.role.request);

  await expect(page.getByRole('heading', { name: 'No swaps found yet' })).toBeVisible();
  await expect(page.getByText(/^\d+ offers? checked: \d+ (is|are) from (someone|people) without the qualification your shift needs\.$/)).toBeVisible();
  await captureAll(page, 'swap-role-refusal');
});
