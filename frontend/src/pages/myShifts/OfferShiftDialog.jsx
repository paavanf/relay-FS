// OfferShiftDialog - offer one of your shifts for a swap.
//
// Says plainly what offering does and does not do: Relay starts looking for
// people who could swap with you, the shift stays yours, and nobody is
// asked anything. The note is optional; your manager can read it alongside
// the request.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useOfferShift } from '../../features/swaps/hooks/useSwapRequests.js';

// The server's limit too (SWAP_NOTE_MAX_LENGTH).
const NOTE_LIMIT = 280;

export function OfferShiftDialog({ assignment, label, onClose }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const offer = useOfferShift(orgId);
  const [note, setNote] = useState('');

  function submit(event) {
    event.preventDefault();
    offer.mutate(
      { assignmentId: assignment.id, note: note.trim() },
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
          <div className="space-y-4 px-5 py-4">
            <div>
              <DialogTitle>Offer this shift?</DialogTitle>
              <DialogDescription>
                {label}. Relay will look for people who could swap with you, directly or round a chain of
                people. The shift stays yours: offering it only lets Relay look.
              </DialogDescription>
            </div>

            <Textarea
              label="Note (optional)"
              rows={3}
              maxLength={NOTE_LIMIT}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why you need it covered, or what you could take instead."
              autoFocus
            />

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
