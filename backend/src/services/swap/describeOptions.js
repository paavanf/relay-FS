// describeOptions.js
// Turns the engine's answer into the options response: the request, every
// option's hand-overs with names and shift details, the score behind its
// place, and the reasons when there is nothing.
//
// Names only for the people in an option - nobody can understand a chain
// without them - and nothing about anyone else in the organisation. The
// "no options" reasons are counts, never people.

import { namesOf } from '../member/memberNames.js';
import { describeRequests } from './swapRequestDto.js';
import { shiftDto } from './describeShifts.js';

export async function describeOptions({ request, input, result, viewer }) {
  const options = [...result.direct, ...result.chains];
  const names = await namesOf(options.flatMap((option) => option.legs.flatMap((leg) => [leg.from, leg.to])));
  const assignments = new Map(input.assignments.map((a) => [a.id, a]));
  const templates = new Map(input.templates.map((t) => [t.id, t]));

  const person = (membershipId) => ({ membershipId, name: names.get(membershipId) ?? 'A team member' });
  const describe = (chain) => ({
    size: chain.size,
    score: chain.score,
    legs: chain.legs.map((leg) => {
      const assignment = assignments.get(leg.assignmentId);
      return { from: person(leg.from), to: person(leg.to), assignment: shiftDto(assignment, templates.get(assignment.shiftTemplateId)) };
    }),
  });

  const [described] = await describeRequests([request], viewer);
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
