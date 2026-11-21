// describeOptions.js
// Turns the engine's answer into the options response: the request, every
// option's hand-overs with names and shift details, the score behind its
// place, its key - what a proposal names it by (optionKey.js) - and the
// reasons when there is nothing.
//
// Names only for the people in an option - nobody can understand a chain
// without them - and nothing about anyone else in the organisation. The
// "no options" reasons are counts, never people.

import { namesOf } from '../member/memberNames.js';
import { describeRequests } from './swapRequestDto.js';
import { shiftDto } from './describeShifts.js';
import { optionKeyOf } from './optionKey.js';

export async function describeOptions({ request, input, result, viewer }) {
  const options = [...result.direct, ...result.chains];
  // The names in the options and the request's own description need nothing
  // from each other, so they are read together.
  const [names, [described]] = await Promise.all([
    namesOf(options.flatMap((option) => option.legs.flatMap((leg) => [leg.from, leg.to]))),
    describeRequests([request], viewer),
  ]);
  const assignments = new Map(input.assignments.map((a) => [a.id, a]));
  const templates = new Map(input.templates.map((t) => [t.id, t]));

  const person = (membershipId) => ({ membershipId, name: names.get(membershipId) ?? 'A team member' });
  const describe = (chain) => ({
    key: optionKeyOf(chain),
    size: chain.size,
    score: chain.score,
    legs: chain.legs.map((leg) => {
      const assignment = assignments.get(leg.assignmentId);
      return { from: person(leg.from), to: person(leg.to), assignment: shiftDto(assignment, templates.get(assignment.shiftTemplateId)) };
    }),
  });

  const { offersConsidered, cyclesChecked, validCycles, truncated, durationMs } = result.stats;

  return {
    request: described,
    maxLength: input.maxLength,
    direct: result.direct.map(describe),
    chains: result.chains.map(describe),
    noMatch: result.noMatchReasons,
    stats: { offersConsidered, cyclesChecked, validCycles, truncated, durationMs },
  };
}
