// readableAnswer.js
// A swap options answer from the chain world (../swapChains/chainWorld.js),
// with every id replaced by whose it is and every date by its distance from
// today, so it reads as what it says and is the same on every run. The two
// things that differ from run to run by nature are set aside: when the
// offer was made, and how long the search took.

import { ShiftTemplate } from '../../src/models/index.js';
import { dateFromToday } from './swapWorld.js';

export async function readableAnswer(body, world) {
  const template = await ShiftTemplate.findOne({ orgId: world.orgId }).lean();
  const names = new Map([[String(template._id), 'the Day template']]);
  for (const [who, person] of Object.entries(world.people)) {
    names.set(person.membershipId, who);
    names.set(world.offers[who].requestId, `${who}'s offer`);
    names.set(world.offers[who].assignmentId, `${who}'s shift`);
  }
  for (const days of [5, 7, 9]) names.set(dateFromToday(days), `today+${days}`);

  const steady = {
    ...body,
    request: { ...body.request, createdAt: 'when it was offered' },
    stats: { ...body.stats, durationMs: 'how long it took' },
  };
  return JSON.parse(JSON.stringify(steady).replace(/[0-9a-f]{24}|\d{4}-\d{2}-\d{2}/g, (found) => names.get(found) ?? found));
}
