// QualificationDialog - creates a qualification, or edits an existing one.
// Pass `qualification` to edit; omit it to create.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog/index.js';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  createQualification,
  updateQualification,
} from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function QualificationDialog({ qualification, onClose }) {
  const isEdit = Boolean(qualification);
  const [name, setName] = useState(qualification?.name ?? '');
  const [code, setCode] = useState(qualification?.code ?? '');
  const [description, setDescription] = useState(qualification?.description ?? '');

  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? updateQualification(orgId, qualification._id, data)
        : createQualification(orgId, data),
    onSuccess: () => {
      // Refetch the list so the table shows the change immediately.
      queryClient.invalidateQueries({ queryKey: ['qualifications', orgId] });
      showToast({ type: 'success', title: isEdit ? 'Changes saved' : 'Qualification added' });
      onClose();
    },
    onError: (err) =>
      showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate({ name, code, description });
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>{isEdit ? 'Edit qualification' : 'Add qualification'}</DialogTitle>
          <DialogDescription>
            The code is shown on the roster grid, where space is tight.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registered Nurse"
              minLength={2}
              maxLength={60}
              autoFocus
              required
            />

            <Input
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RN"
              maxLength={20}
              hint="Stored in capitals, and unique within this organisation."
              required
            />

            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              maxLength={200}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add qualification'}
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
