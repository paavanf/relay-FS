// toEngineAssignment.js
// A stored assignment as the constraint engine takes it: plain strings, ISO
// instants, and the role it fills. One converter for every caller - manual
// edits, the swap search and the demo seed - so none of them can forget the
// role and quietly drop back to the looser legacy qualification rule.

export function toEngineAssignment(a) {
  return {
    id: String(a._id),
    membershipId: String(a.membershipId),
    shiftTemplateId: String(a.shiftTemplateId),
    // Left out entirely on legacy records, which have none.
    ...(a.slotQualificationId ? { slotQualificationId: String(a.slotQualificationId) } : {}),
    date: a.date,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
  };
}
