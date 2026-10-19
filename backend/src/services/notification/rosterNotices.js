// rosterNotices.js
// A roster published: every worker with a shift on it - still on the team -
// hears about it, with how many of its shifts are theirs, and a link to My
// Shifts. Emailed too, since people plan their week around it.

import { Assignment, Membership } from '../../models/index.js';
import { MEMBERSHIP_STATUS } from '../../config/constants.js';
import { dateRange } from './noticeWords.js';

export async function rosterNotices(event, { roster }) {
  const counts = await Assignment.aggregate([
    { $match: { rosterId: roster._id } },
    { $group: { _id: '$membershipId', shifts: { $sum: 1 } } },
  ]);
  const active = await Membership.find({ _id: { $in: counts.map((c) => c._id) }, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id').lean();
  const onTeam = new Set(active.map((m) => String(m._id)));
  const range = dateRange(roster.startDate, roster.endDate);

  return counts
    .filter((count) => onTeam.has(String(count._id)))
    .map((count) => ({
      orgId: roster.orgId,
      membershipId: String(count._id),
      type: event,
      message: `The roster for ${range} is published. You have ${count.shifts} ${count.shifts === 1 ? 'shift' : 'shifts'} on it.`,
      link: `/app/${roster.orgId}/my-shifts`,
      rosterId: roster._id,
      dedupeKey: `${event}:${roster._id}:${count._id}`,
      email: { subject: `Your shifts for ${range} are published`, label: 'See my shifts' },
    }));
}
