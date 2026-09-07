// DeleteCoverageButton - confirms, then removes one coverage rule.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { deleteCoverage } from '../../../features/catalog/api/coverage.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function DeleteCoverageButton({ coverage, dayLabel }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteCoverage(orgId, coverage._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage', orgId] });
      showToast({ type: 'success', title: 'Coverage rule removed' });
      setIsConfirming(false);
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not remove', message: err.message }),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="shrink-0 rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-danger"
        aria-label={`Remove the ${dayLabel} rule`}
      >
        <Trash2 className="size-4" />
      </button>

      <Dialog isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
        <DialogPanel>
          <div className="px-5 py-4">
            <DialogTitle>Remove the {dayLabel} rule?</DialogTitle>
            <DialogDescription>
              That shift will have no required staffing on {dayLabel} until a new rule is set.
            </DialogDescription>
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
              Remove
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}
