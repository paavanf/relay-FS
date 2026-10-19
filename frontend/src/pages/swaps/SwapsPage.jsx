// SwapsPage - swapping shifts, from offering one to the swap happening:
//
//   Waiting for you   proposals you have not answered yet, with Accept and
//                     Decline - first, because people answer on their phones
//   Your proposals    swaps you proposed or accepted, still going, with where
//                     everyone stands and how long is left
//   My offers         your open offers, each with "Find swaps" beside its
//                     options; proposing one asks everyone else in it
//   History           swaps that have ended, and how
//   Updates           what has happened to your swaps
//   Swap rules        how swaps work in this organisation, read-only
//
// Proposals and updates are fetched every 15 seconds while the page is
// open, and when the window regains focus.
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { SwapProposals, SwapHistory } from './SwapProposals.jsx';
import { OffersAndOptions } from './OffersAndOptions.jsx';
import { SwapUpdates } from './SwapUpdates.jsx';
import { SwapRulesNote } from './SwapRulesNote.jsx';

function SwapsPage() {
  useDocumentTitle('Swaps');
  const { showToast } = useToast();
  const [proposedId, setProposedId] = useState(null);

  function onProposed(chain) {
    setProposedId(chain.id);
    showToast({ type: 'success', title: 'Swap proposed', message: 'Everyone else in it has been asked to accept.' });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Swaps"
        description="Offer a shift you cannot work, and see who could take it - directly, or round a chain of people."
      />

      <div className="mt-6 space-y-8">
        <SwapProposals highlightId={proposedId} />
        <OffersAndOptions onProposed={onProposed} />
        <SwapHistory />
        <SwapUpdates />
        <SwapRulesNote />
      </div>
    </div>
  );
}

export default SwapsPage;
