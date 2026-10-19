// preferences.service.js
// Someone's own preferences in an organisation - for now, one: "Email me
// about swaps and rosters". Always the caller's own membership; nobody
// changes anyone else's.

import { Membership } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

const toPreferences = (membership) => ({ emailNotifications: membership.emailNotifications !== false });

export async function getPreferences({ membership }) {
  return toPreferences(membership);
}

export async function updatePreferences({ membership, emailNotifications }) {
  const updated = await Membership.findByIdAndUpdate(membership._id, { $set: { emailNotifications } }, { new: true, lean: true });
  if (!updated) throw AppError.notFound('Membership not found');
  return toPreferences(updated);
}
