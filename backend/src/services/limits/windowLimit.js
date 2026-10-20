// windowLimit.js
// The limits counted from the database instead of in memory - invites per
// organisation per day, swaps proposed per person per hour - so they hold
// across restarts and however many servers run. A limit is a count of what
// was created inside the window; when the window is full, the oldest record
// in it says when room opens up again, and the 429 says so.

import { AppError } from '../../errors/AppError.js';
import { waitWords } from '../../utils/waitWords.js';

/**
 * Throws a 429 when `filter` already matches `max` records created in the
 * last `windowMs`. `message` says what the limit is; the wait is added to it.
 */
export async function assertUnderLimit(Model, filter, { windowMs, max }, message) {
  const recent = await Model.find({ ...filter, createdAt: { $gt: new Date(Date.now() - windowMs) } })
    .sort({ createdAt: -1 })
    .limit(max)
    .select('createdAt')
    .lean();
  if (recent.length < max) return;

  // The oldest of the newest `max` leaves the window first.
  const wait = recent[max - 1].createdAt.getTime() + windowMs - Date.now();
  throw AppError.tooManyRequests(`${message} Try again ${waitWords(wait)}.`, { retryAfterMs: wait });
}
