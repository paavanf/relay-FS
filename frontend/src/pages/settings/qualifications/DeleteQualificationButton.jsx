// DeleteQualificationButton - asks before removing, since coverage rules are
// written in terms of qualifications.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { deleteQualification } from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function DeleteQualificationButton({ qualification }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteQualification(orgId, qualification._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualifications', orgId] });
      showToast({ type: 'success', title: 'Qualification removed' });
      setIsConfirming(false);
    },
    onError: (err) =>
      showToast({ type: 'error', title: 'Could not remove', message: err.message }),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-sm p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-danger-content"
        aria-label={`Remove ${qualification.name}`}
      >
        <Trash2 className="size-4" />
      </button>

      <Dialog isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
        <DialogPanel>
          <div className="px-5 py-4">
            <DialogTitle>Remove {qualification.name}?</DialogTitle>
            <DialogDescription>
              Any coverage rule that asks for this qualification will no longer be satisfiable.
            </DialogDescription>
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
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
