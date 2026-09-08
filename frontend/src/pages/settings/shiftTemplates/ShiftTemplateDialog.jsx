// ShiftTemplateDialog - creates or edits a shift pattern.
//
// crossesMidnight is not a field here: the server derives it from the times,
// and the request schema rejects it if sent.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ShiftTemplateFields } from './ShiftTemplateFields.jsx';
import {
  createShiftTemplate,
  updateShiftTemplate,
} from '../../../features/catalog/api/shiftTemplates.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function ShiftTemplateDialog({ template, onClose }) {
  const isEdit = Boolean(template);
  const [form, setForm] = useState({
    name: template?.name ?? '',
    startLocal: template?.startLocal ?? '07:00',
    endLocal: template?.endLocal ?? '15:00',
    category: template?.category ?? 'day',
    burdenWeight: template?.burdenWeight ?? 1.0,
  });

  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateShiftTemplate(orgId, template._id, data) : createShiftTemplate(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTemplates', orgId] });
      showToast({ type: 'success', title: isEdit ? 'Shift template updated' : 'Shift template added' });
      onClose();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  function handleSubmit(event) {
    event.preventDefault();
    // burdenWeight must be a number: a select/input gives back a string.
    mutation.mutate({ ...form, burdenWeight: Number(form.burdenWeight) });
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>{isEdit ? 'Edit shift template' : 'Add shift template'}</DialogTitle>
          <DialogDescription>Times are local to this organisation.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <ShiftTemplateFields form={form} setForm={setForm} />

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add shift template'}
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
