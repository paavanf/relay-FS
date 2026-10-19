// roles.js
// The roles on a shift, and how many of each are filled - for the assign
// dialog ("Charge Nurse - 1 of 1 open") and the coverage row.
//
// A shift's roles are its coverage rule for that weekday: "Day on Monday
// needs 1 Charge Nurse and 3 Registered Nurses". An assignment fills the role
// it records (slotQualificationId); one without a role is a legacy record and
// fills no particular place. Dates are local calendar days, so the weekday is
// read from the date itself (0 = Sunday, as the rules store it).

const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** The places a shift has on a date: [{ qualificationId, required }], in the rule's order. */
export function placesFor(coverage, shiftTemplateId, date) {
  const rule = coverage.find((c) => String(c.shiftTemplateId) === String(shiftTemplateId) && c.dayOfWeek === weekdayOf(date));
  return (rule?.requirements ?? []).map((r) => ({ qualificationId: String(r.qualificationId), required: r.count }));
}

/**
 * Each role on the shift, for one person: [{ qualificationId, name, required,
 * filled, open, held }]. `ignoreId` leaves out the assignment being edited, so
 * it does not count against itself.
 */
export function roleChoices({ coverage, qualificationsById, assignments, shiftTemplateId, date, member, ignoreId }) {
  const held = new Set(member?.qualificationIds ?? []);
  const onShift = assignments.filter((a) => a.id !== ignoreId && a.date === date && String(a.shiftTemplateId) === String(shiftTemplateId));

  return placesFor(coverage, shiftTemplateId, date).map(({ qualificationId, required }) => {
    const filled = onShift.filter((a) => a.slotQualificationId === qualificationId).length;
    return {
      qualificationId,
      name: qualificationsById.get(qualificationId)?.name ?? 'Role',
      required,
      filled,
      open: Math.max(0, required - filled),
      held: held.has(qualificationId),
    };
  });
}

/** The role to choose for them: their only role on the shift, or else their only role with a place still open. */
export function defaultRole(choices) {
  const theirs = choices.filter((choice) => choice.held);
  if (theirs.length === 1) return theirs[0].qualificationId;
  const open = theirs.filter((choice) => choice.open > 0);
  return open.length === 1 ? open[0].qualificationId : null;
}
