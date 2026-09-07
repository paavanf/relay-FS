// SaveAvailabilityBar - turns the weekday selections into entries and saves.
//
// The PUT replaces the whole set, so days left as "Available" are simply
// omitted rather than sent as a status.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button.jsx';
import { setMyAvailability } from '../../features/availability/api/availability.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useToast } from '../../components/ui/toast/useToast.js';

export function SaveAvailabilityBar({ statusByDay, isDirty, onSaved }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const entries = Object.entries(statusByDay)
        .filter(([, status]) => status && status !== 'available')
        .map(([dayOfWeek, status]) => ({
          type: 'recurring',
          dayOfWeek: Number(dayOfWeek),
          status,
        }));

      return setMyAvailability(orgId, entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', orgId] });
      showToast({ type: 'success', title: 'Availability saved' });
      onSaved();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  return (
    <div className="flex items-center justify-end gap-3">
      {isDirty && <p className="text-[13px] text-ink-subtle">You have unsaved changes.</p>}

      <Button onClick={() => mutation.mutate()} disabled={!isDirty} isLoading={mutation.isPending}>
        Save availability
      </Button>
    </div>
  );
}
