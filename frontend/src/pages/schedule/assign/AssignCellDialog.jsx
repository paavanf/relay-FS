// AssignCellDialog - assign, change or clear one worker's shift on one day.
//
// Choosing a shift immediately asks the server whether it would be legal, so
// the verdict is on screen before Save is pressed. Save stays disabled while
// the answer is no: the server would refuse anyway, and a button that fails
// is worse than one that explains.
import { useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog/index.js';
import { AssignDialogFooter } from './AssignDialogFooter.jsx';
import { ValidationNotice } from './ValidationNotice.jsx';
import { ShiftChoices } from './ShiftChoices.jsx';
import { useAssignValidation } from './useAssignValidation.js';
import { useAssignMutations } from './useAssignMutations.js';
import { formatLongDate } from '../format.js';

export function AssignCellDialog({ rosterId, cell, templates, onClose }) {
  const { member, date, assignment } = cell;
  const [chosenId, setChosenId] = useState(assignment?.shiftTemplateId ?? null);

  const isChanged = chosenId !== (assignment?.shiftTemplateId ?? null);

  const { result, isChecking } = useAssignValidation({
    rosterId,
    membershipId: member.id,
    shiftTemplateId: isChanged ? chosenId : null,
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
          <ShiftChoices templates={templates} chosenId={chosenId} onChoose={setChosenId} />
          {isChanged && <ValidationNotice isChecking={isChecking} result={result} />}
        </div>

        <AssignDialogFooter
          assignment={assignment}
          canSave={Boolean(isChanged && chosenId && !isChecking && result?.allowed)}
          isSaving={isSaving}
          onClear={() => clear(assignment.id)}
          onClose={onClose}
          onSave={() =>
            save({ assignment, membershipId: member.id, shiftTemplateId: chosenId, date })
          }
        />
      </DialogPanel>
    </Dialog>
  );
}
