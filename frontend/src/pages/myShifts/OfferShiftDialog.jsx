// OfferShiftDialog - offer one of your shifts for a swap.
//
// Says plainly what offering does and does not do: Relay starts looking for
// people who could swap with you, the shift stays yours, and nobody is asked
// anything. The note and "what would you take in return?" are optional; both
// can be changed later on the Swaps page.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useOfferShift } from '../../features/swaps/hooks/useSwapRequests.js';
import { OfferFields } from '../../features/swaps/components/OfferFields.jsx';

export function OfferShiftDialog({ assignment, label, onClose }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const offer = useOfferShift(orgId);
  const [note, setNote] = useState('');
  const [filters, setFilters] = useState({ categories: [], daysOfWeek: [] });

  function submit(event) {
    event.preventDefault();
    offer.mutate(
      { assignmentId: assignment.id, note: note.trim(), acceptableShiftFilters: filters },
      {
        onSuccess: () => {
          showToast({ type: 'success', title: 'Shift offered', message: 'Find swaps for it on the Swaps page.' });
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
              <DialogTitle>Offer this shift?</DialogTitle>
              <DialogDescription>
                {label}. Relay will look for people who could swap with you, directly or round a chain of
                people. The shift stays yours: offering it only lets Relay look.
              </DialogDescription>
            </div>

            <OfferFields note={note} onNote={setNote} filters={filters} onFilters={setFilters} />
            {offer.error && <Callout variant="danger">{offer.error.message}</Callout>}
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={offer.isPending}>
              Offer shift
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
