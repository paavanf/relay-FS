// SwapsPage - swapping shifts, from offering one to the swap happening:
//
//   Waiting for you   proposals you have not answered yet, with Accept and
//                     Decline - first, because people answer on their phones
//   Your proposals    swaps you proposed or accepted, still going, with where
//                     everyone stands and how long is left
//   My offers         your open offers, each with "Find swaps" beside its
//                     options; proposing one asks everyone else in it
//   History           swaps that have ended, and how
//   Swap rules        how swaps work in this organisation, read-only
//
// What has happened to your swaps is told under the bell (Milestone 9). A
// notification links here with ?chain=<id>, and that swap is brought into
// view, outlined. Proposals are fetched every 15 seconds while the page is
// open, and when the window regains focus.
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { SwapProposals, SwapHistory } from './SwapProposals.jsx';
import { OffersAndOptions } from './OffersAndOptions.jsx';
import { SwapRulesNote } from './SwapRulesNote.jsx';

function SwapsPage() {
  useDocumentTitle('Swaps');
  const { showToast } = useToast();
  const [proposedId, setProposedId] = useState(null);
  const [params] = useSearchParams();
  const linkedId = params.get('chain');

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
        <SwapProposals highlightId={proposedId ?? linkedId} />
        <OffersAndOptions onProposed={onProposed} />
        <SwapHistory highlightId={linkedId} />
        <SwapRulesNote />
      </div>
    </div>
  );
}

export default SwapsPage;
