// EditMemberDialog - change what someone is qualified for and contracted to
// work, and - for owners - their role.
//
// The server enforces who may change what, and keeps the last owner from
// stepping down; its refusal is shown as it comes. Only changed fields are
// sent (memberChanges.js), and useMemberSave does the sending.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { MemberFields } from './MemberFields.jsx';
import { formValuesOf, hoursProblem, changedFields } from './memberChanges.js';
import { useMemberSave } from './useMemberSave.js';

export function EditMemberDialog({ member, qualifications, onClose }) {
  const { isOwner } = useOrg();
  const [values, setValues] = useState(() => formValuesOf(member));
  const [hoursError, setHoursError] = useState(null);
  const save = useMemberSave(member, onClose);

  function handleSubmit(event) {
    event.preventDefault();
    const problem = hoursProblem(values.hours);
    setHoursError(problem);
    if (problem) return;

    const changes = changedFields(member, values, { canChangeRole: isOwner });
    if (Object.keys(changes).length === 0) onClose();
    else save.mutate(changes);
  }

  return (
    <Dialog isOpen onClose={onClose}>
      {/* Scrolls rather than overflowing a short screen when the list of
          qualifications is long. */}
      <DialogPanel className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line-subtle px-5 py-4">
            <DialogTitle>Edit {member.name}</DialogTitle>
            <DialogDescription>{member.email}</DialogDescription>
          </div>

          <MemberFields
            values={values}
            onChange={setValues}
            qualifications={qualifications}
            showRole={isOwner}
            hoursError={hoursError}
          />

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={save.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
