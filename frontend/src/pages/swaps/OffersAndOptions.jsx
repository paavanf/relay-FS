// OffersAndOptions - your open offers (and, for a manager, everyone's), each
// with "Find swaps", beside the options for the one chosen - below it on a
// phone.
//
// Proposing an option turns it into a proposal: its offer is now part of a
// swap, so it leaves this list, the options close, and the proposal appears
// above under Your proposals.
import { useState } from 'react';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapRequests } from '../../features/swaps/hooks/useSwapRequests.js';
import { OfferList } from './OfferList.jsx';
import { NoOffers, ChooseAnOffer } from './SwapsEmptyStates.jsx';
import { OptionsPanel } from './OptionsPanel.jsx';

export function OffersAndOptions({ onProposed }) {
  const { orgId, isManager } = useOrg();
  const requests = useSwapRequests(orgId);
  const [selectedId, setSelectedId] = useState(null);

  if (requests.isPending) return <Skeleton className="h-48 w-full" />;
  if (requests.error) return <ErrorState message={requests.error.message} onRetry={requests.refetch} />;

  // Open offers only - one in a proposal is shown with the proposal - and
  // none whose shift has gone from the roster.
  const open = requests.data.filter((request) => request.assignment && request.status === 'open');
  const selected = open.find((request) => request.id === selectedId) ?? null;
  const choosing = { selectedId, onFind: setSelectedId };
  const proposed = (chain) => {
    setSelectedId(null);
    onProposed(chain);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-6">
        <OfferList title="My offers" requests={open.filter((r) => r.mine)} empty={<NoOffers orgId={orgId} />} {...choosing} />
        {isManager && (
          <OfferList
            title="Everyone's open offers"
            requests={open.filter((r) => !r.mine)}
            empty="Nobody else has an open offer right now."
            showRequester
            {...choosing}
          />
        )}
      </div>

      {selected ? <OptionsPanel key={selected.id} orgId={orgId} request={selected} onProposed={proposed} /> : <ChooseAnOffer />}
    </div>
  );
}
