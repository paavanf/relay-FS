// OfferControls - the swap part of a shift card on My Shifts.
//
// A shift still to come can be offered for a swap. Once offered, the card
// says so, links to its options, and lets the offer be withdrawn. ShiftList
// shows these only on shifts that have not started: one underway can no
// longer be handed over, and the server would refuse it anyway.
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useWithdrawOffer } from '../../features/swaps/hooks/useSwapRequests.js';
import { OfferShiftDialog } from './OfferShiftDialog.jsx';

export function OfferControls({ assignment, label, offer }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const withdraw = useWithdrawOffer(orgId);
  const [isOffering, setIsOffering] = useState(false);

  function withdrawOffer() {
    withdraw.mutate(offer.id, {
      onSuccess: () => showToast({ type: 'success', title: 'Offer withdrawn', message: 'This shift is no longer up for a swap.' }),
      onError: (error) => showToast({ type: 'error', title: 'Could not withdraw the offer', message: error.message }),
    });
  }

  if (offer) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant="brand">Offered for a swap</Badge>
        <Link
          to={`/app/${orgId}/swaps`}
          className="text-body-sm font-medium text-brand-content underline-offset-2 hover:underline"
        >
          Find swaps
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          isLoading={withdraw.isPending}
          aria-label={`Withdraw offer: ${label}`}
          onClick={withdrawOffer}
        >
          Withdraw offer
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" aria-label={`Offer this shift: ${label}`} onClick={() => setIsOffering(true)}>
        Offer this shift
      </Button>
      {isOffering && <OfferShiftDialog assignment={assignment} label={label} onClose={() => setIsOffering(false)} />}
    </>
  );
}
