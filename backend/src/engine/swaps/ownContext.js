// ownContext.js
// The engine context narrowed to one worker: their own worker record and
// their own availability, with the rules, shift templates and coverage left
// as they are.
//
// Every check the swap finder makes is about one person's schedule, and no
// hard constraint looks across two people (see validateCycle.js), so nothing
// is lost. It is purely for speed: the engine normalises the whole context on
// every call, and a search over many offers makes thousands of calls. It is
// the same idea as scheduling/eligibility.js showing each candidate only
// their own assignments.

const own = (list, membershipId) => (Array.isArray(list) ? list.filter((item) => item?.membershipId === membershipId) : []);

/** Returns ownContext(membershipId), which builds each person's narrowed context once. */
export function createOwnContext(context) {
  const narrowed = new Map();

  return function ownContext(membershipId) {
    if (!narrowed.has(membershipId)) {
      narrowed.set(membershipId, {
        ...context,
        workers: own(context?.workers, membershipId),
        availability: own(context?.availability, membershipId),
      });
    }
    return narrowed.get(membershipId);
  };
}
