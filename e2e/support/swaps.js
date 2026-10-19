// swaps.js
// The demo's swap cases, found the way a manager would see them: every open
// request, and the options for each, through the real API.
//
// The seed picks its cases with the real engine (backend/scripts/demo/
// swapCases.js), so the suite looks them up rather than hard-coding names.
//
//   chain   no direct swap, and a three-person chain at the top (in the demo,
//           because its owner said what they would take in return)
//   direct  has a direct swap
//   none    no options, because of the days its owner cannot work
//   role    no options, because nobody else offering holds the role its
//           shift fills

import { apiAs } from './api.js';
import { stack } from './stack.js';
import { manager, everyone } from './people.js';

function kindOf(options) {
  if (options.direct.length > 0) return 'direct';
  if (options.chains[0]?.size === 3) return 'chain';
  if (options.chains.length > 0) return 'longer';
  const why = options.noMatch?.summary ?? '';
  if (why.includes('without the qualification your shift needs')) return 'role';
  return why.includes('marked unavailable') ? 'none' : 'other';
}

/** { chain, direct, none, role } - each { request, options, person } for the first request of that kind. */
export async function findSwapCases() {
  const { orgId } = stack();
  const api = await apiAs(manager);
  const cases = {};

  const { swapRequests } = (await api.get(`/orgs/${orgId}/swap-requests`)).body;
  for (const request of swapRequests.filter((r) => r.status === 'open')) {
    const options = (await api.get(`/orgs/${orgId}/swap-requests/${request.id}/options`)).body;
    const person = everyone.find((p) => p.name === request.requester.name);
    cases[kindOf(options)] ??= { request, options, person };
  }

  await api.dispose();
  return cases;
}

/** The best option of one kind on the page - 'Direct swaps' or 'Swap chains' - as its card. */
export const firstOption = (page, group) =>
  page.getByRole('region', { name: group }).getByRole('listitem').filter({ has: page.getByRole('img') }).first();

export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** A shift as the Swaps page names it: "Tuesday 17 March, Night". */
export const shiftTitleOf = (assignment) => `${longDate.format(new Date(`${assignment.date}T00:00:00Z`))}, ${assignment.shift.name}`;

/** On the Swaps page, as the requester: "Find swaps" on that one offer of theirs (some people offer two). */
export async function findSwapsForMyOffer(page, request) {
  const mine = page.getByRole('region', { name: 'My offers' });
  await mine.getByRole('button', { name: `Find swaps: ${shiftTitleOf(request.assignment)}` }).click();
}

/**
 * Where every arrow of a chain diagram starts and ends, and where the people
 * sit, as the browser drew them - so a spec can check the lines stop short of
 * the circles rather than running to their centres.
 */
export function diagramGeometry(diagram) {
  return diagram.evaluate((svg) => {
    const point = (p) => ({ x: p.x, y: p.y });
    const marker = svg.querySelector('marker');
    return {
      orient: marker?.getAttribute('orient'),
      circles: [...svg.querySelectorAll('circle')].map((c) => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r') })),
      arrows: [...svg.querySelectorAll('path[marker-end]')].map((path) => ({
        start: point(path.getPointAtLength(0)),
        end: point(path.getPointAtLength(path.getTotalLength())),
      })),
    };
  });
}

const HEAD = 9; // the arrowhead's length, as in frontend/src/features/swaps/components/chainLayout.js
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Where drawn arrows break the rule: each must start outside every circle,
 * and end far enough short of every circle for its head to fit - never at a
 * centre, as an earlier graphic's did. Empty when every arrow keeps it.
 */
export function arrowProblems({ circles, arrows }) {
  const problems = [];
  arrows.forEach((arrow, i) =>
    circles.forEach((circle, j) => {
      if (distance(arrow.start, circle) <= circle.r) problems.push(`arrow ${i} starts inside circle ${j}`);
      if (distance(arrow.end, circle) <= circle.r + HEAD) problems.push(`arrow ${i}'s head reaches into circle ${j}`);
    }),
  );
  return problems;
}
