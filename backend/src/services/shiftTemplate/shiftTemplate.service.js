// shiftTemplate.service.js
// Business logic for shift templates.

import { ShiftTemplate } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

// A shift whose end is not after its start runs into the next day.
// "23:00" -> "07:00" crosses; "07:00" -> "15:00" does not. Comparing the
// strings works because they are zero-padded 24-hour times.
function crossesMidnight(startLocal, endLocal) {
  return endLocal <= startLocal;
}

export async function listShiftTemplates(orgId) {
  return ShiftTemplate.find({ orgId, active: true }).sort({ startLocal: 1 }).lean();
}

export async function createShiftTemplate(orgId, data) {
  return ShiftTemplate.create({
    ...data,
    orgId,
    crossesMidnight: crossesMidnight(data.startLocal, data.endLocal),
  });
}

export async function updateShiftTemplate(orgId, templateId, data) {
  const template = await ShiftTemplate.findOne({ _id: templateId, orgId, active: true });
  if (!template) throw AppError.notFound('Shift template not found');

  Object.assign(template, data);

  // Recomputed from whatever the times now are, whether or not they changed.
  template.crossesMidnight = crossesMidnight(template.startLocal, template.endLocal);

  await template.save();
  return template;
}

export async function deleteShiftTemplate(orgId, templateId) {
  // Retired rather than removed: published rosters reference templates and
  // must stay readable after one is withdrawn.
  const retired = await ShiftTemplate.findOneAndUpdate(
    { _id: templateId, orgId, active: true },
    { $set: { active: false } },
    { new: true },
  );

  if (!retired) throw AppError.notFound('Shift template not found');
}
