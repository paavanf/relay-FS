// DeleteShiftTemplateButton - confirms, then retires a shift template.
// The server keeps the record and marks it inactive, so existing rosters that
// reference it stay readable.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { deleteShiftTemplate } from '../../../features/catalog/api/shiftTemplates.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function DeleteShiftTemplateButton({ template }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteShiftTemplate(orgId, template._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTemplates', orgId] });
      // Coverage rules point at templates, so that list can change too.
      queryClient.invalidateQueries({ queryKey: ['coverage', orgId] });
      showToast({ type: 'success', title: 'Shift template retired' });
      setIsConfirming(false);
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not remove', message: err.message }),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-danger"
        aria-label={`Remove ${template.name}`}
      >
        <Trash2 className="size-4" />
      </button>

      <Dialog isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
        <DialogPanel>
          <div className="px-5 py-4">
            <DialogTitle>Retire {template.name}?</DialogTitle>
            <DialogDescription>
              It will stop appearing when building new rosters. Rosters already using it keep
              working.
            </DialogDescription>
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
              Retire
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}
