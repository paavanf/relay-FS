// steps.js
// The real workflow, from an empty organisation to people reading their
// shifts. Each step names screens that exist in the app today; `visual`
// marks the two steps where a real component adds something the words do
// not.

export const STEPS = [
  {
    title: 'Describe the work',
    body: 'Add the qualifications your team holds and the shifts you run, then say how many people each shift needs on each day of the week.',
  },
  {
    title: 'Collect availability',
    body: 'Everyone marks the days they cannot work, would rather avoid, or would like. Only "unavailable" is a hard rule.',
    visual: 'availability',
  },
  {
    title: 'Generate',
    body: 'Relay builds the roster in the background and lists any shift it could not cover, with the reason.',
  },
  {
    title: 'Review and publish',
    body: 'Change any shift by hand; each change is checked first. Publishing shows the roster to the team, and empty shifts have to be acknowledged on purpose.',
  },
  {
    title: 'Everyone sees their own shifts',
    body: 'Each person’s My shifts page lists their upcoming shifts week by week, in your organisation’s time zone.',
    visual: 'myShifts',
  },
];
