// AssignCellDialog - assign, change or clear one worker's shift on one day.
//
// Choose a shift, then the role on it this person fills - chosen for you
// when only one fits. The pair is checked with the server straight away, so
// the verdict is on screen before Save is pressed; Save stays disabled while
// the answer is no, since the server would refuse anyway.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { AssignDialogFooter } from './AssignDialogFooter.jsx';
import { ValidationNotice } from './ValidationNotice.jsx';
import { ShiftChoices } from './ShiftChoices.jsx';
import { RoleChoices } from './RoleChoices.jsx';
import { useAssignValidation } from './useAssignValidation.js';
import { useAssignMutations } from './useAssignMutations.js';
import { roleChoices, defaultRole } from '../roles.js';
import { formatLongDate } from '../format.js';

export function AssignCellDialog({ rosterId, cell, templates, roles, onClose }) {
  const { member, date, assignment } = cell;
  const choicesFor = (shiftTemplateId) => (shiftTemplateId ? roleChoices({ ...roles, shiftTemplateId, date, member, ignoreId: assignment?.id }) : []);

  const [chosenId, setChosenId] = useState(assignment?.shiftTemplateId ?? null);
  const [roleId, setRoleId] = useState(assignment?.slotQualificationId ?? defaultRole(choicesFor(chosenId)));
  const choices = choicesFor(chosenId);
  const needsRole = choices.some((choice) => choice.held);

  const chooseShift = (id) => {
    setChosenId(id);
    setRoleId(defaultRole(choicesFor(id)));
  };

  const isChanged = chosenId !== (assignment?.shiftTemplateId ?? null) || roleId !== (assignment?.slotQualificationId ?? null);
  const isReady = Boolean(chosenId) && (!needsRole || Boolean(roleId));

  const { result, isChecking } = useAssignValidation({
    rosterId,
    membershipId: member.id,
    shiftTemplateId: isChanged && isReady ? chosenId : null,
    slotQualificationId: needsRole ? roleId : null,
    date,
    ignoreAssignmentId: assignment?.id,
  });
  const { save, clear, isSaving } = useAssignMutations({ rosterId, onDone: onClose });

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>{member.name}</DialogTitle>
          <DialogDescription>{formatLongDate(date)}</DialogDescription>
        </div>

        <div className="space-y-4 px-5 py-4">
          <ShiftChoices templates={templates} chosenId={chosenId} onChoose={chooseShift} />
          <RoleChoices choices={choices} chosenId={roleId} onChoose={setRoleId} memberName={member.name} />
          {needsRole && !roleId && <p className="text-body-sm text-content-secondary">Choose which role {member.name} fills.</p>}
          {isChanged && isReady && <ValidationNotice isChecking={isChecking} result={result} />}
        </div>

        <AssignDialogFooter
          assignment={assignment}
          canSave={Boolean(isChanged && isReady && !isChecking && result?.allowed)}
          isSaving={isSaving}
          onClear={() => clear(assignment.id)}
          onClose={onClose}
          onSave={() => save({ assignment, membershipId: member.id, shiftTemplateId: chosenId, slotQualificationId: needsRole ? roleId : null, date })}
        />
      </DialogPanel>
    </Dialog>
  );
}
