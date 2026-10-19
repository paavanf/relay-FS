// EditOfferDialog - change your own open offer: what you would take in
// return, and the note. Widening "what you'd take" is often what turns
// "no swaps found yet" into options, so it is one click from the offer.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useUpdateOffer } from '../../features/swaps/hooks/useSwapRequests.js';
import { OfferFields } from '../../features/swaps/components/OfferFields.jsx';
import { shiftTitle } from '../../features/swaps/shiftWords.js';

export function EditOfferDialog({ request, onClose }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const update = useUpdateOffer(orgId);
  const [note, setNote] = useState(request.note);
  const [filters, setFilters] = useState(request.acceptableShiftFilters);

  function submit(event) {
    event.preventDefault();
    update.mutate(
      { requestId: request.id, note: note.trim(), acceptableShiftFilters: filters },
      {
        onSuccess: () => {
          showToast({ type: 'success', title: 'Changes saved' });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <form onSubmit={submit}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <DialogTitle>Change your offer</DialogTitle>
              <DialogDescription>{shiftTitle(request.assignment)}</DialogDescription>
            </div>
            <OfferFields note={note} onNote={setNote} filters={filters} onFilters={setFilters} />
            {update.error && <Callout variant="danger">{update.error.message}</Callout>}
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={update.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
