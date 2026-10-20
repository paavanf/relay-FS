// CreateRosterDialog - start a new draft over a date range.
//
// The 42-day cap matches the server's. Checking it here too means a mistyped
// year gets a clear message instead of a 422, and the server still refuses if
// anything slips past.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { CreateRosterFields } from './CreateRosterFields.jsx';
import { createRoster } from '../../features/roster/api/rosters.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useToast } from '../../components/ui/toast/useToast.js';
import { validateRange, MAX_ROSTER_DAYS } from './rosterRange.js';

export function CreateRosterDialog({ onCreated, onClose }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [values, setValues] = useState({ name: '', startDate: '', endDate: '' });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: () => createRoster(orgId, values),
    onSuccess: (roster) => {
      queryClient.invalidateQueries({ queryKey: ['rosters', orgId] });
      showToast({ type: 'success', title: 'Roster created' });
      onCreated(roster);
    },
    onError: (err) =>
      showToast({ type: 'error', title: 'Could not create', message: err.message }),
  });

  function set(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validateRange(values);
    setErrors(found);
    if (Object.keys(found).length === 0) mutation.mutate();
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line-subtle px-5 py-4">
            <DialogTitle>New roster</DialogTitle>
            <DialogDescription>
              A draft covering up to {MAX_ROSTER_DAYS} days. Nothing is scheduled until you
              generate it or fill it in.
            </DialogDescription>
          </div>

          <div className="px-5 py-4">
            <CreateRosterFields values={values} errors={errors} onChange={set} />
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
