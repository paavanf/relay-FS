// QualificationDialog - creates a qualification, or edits an existing one.
// Pass `qualification` to edit; omit it to create. The inputs are in
// QualificationFields.jsx and the save in useQualificationSave.js.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { QualificationFields } from './QualificationFields.jsx';
import { useQualificationSave } from './useQualificationSave.js';

export function QualificationDialog({ qualification, onClose }) {
  const isEdit = Boolean(qualification);
  const [values, setValues] = useState({
    name: qualification?.name ?? '',
    code: qualification?.code ?? '',
    description: qualification?.description ?? '',
  });
  const mutation = useQualificationSave(qualification, onClose);

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate(values);
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>{isEdit ? 'Edit qualification' : 'Add qualification'}</DialogTitle>
          <DialogDescription>The code is shown on the roster grid, where space is tight.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <QualificationFields values={values} onChange={setValues} />

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
