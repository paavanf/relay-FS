// SwapsPage - offer a shift you cannot work, and see who could take it:
// directly, or round a chain of people who each take the next one's shift.
//
// Your open offers come first, each with "Find swaps"; managers also see
// everyone else's. Choosing one shows its options beside the list on a wide
// screen, or below it on a phone. This is search only for now - proposing a
// swap arrives in the next update, and each option says so.
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapRequests } from '../../features/swaps/hooks/useSwapRequests.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { OfferList } from './OfferList.jsx';
import { NoOffers, ChooseAnOffer } from './SwapsEmptyStates.jsx';
import { OptionsPanel } from './OptionsPanel.jsx';

function SwapsPage() {
  const { orgId, isManager } = useOrg();
  useDocumentTitle('Swaps');
  const requests = useSwapRequests(orgId);
  const [selectedId, setSelectedId] = useState(null);

  // A request whose shift has gone from the roster has nothing to show.
  const open = (requests.data ?? []).filter((request) => request.assignment);
  const selected = open.find((request) => request.id === selectedId) ?? null;
  const choosing = { selectedId, onFind: setSelectedId };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Swaps"
        description="Offer a shift you cannot work, and see who could take it - directly, or round a chain of people."
      />

      {requests.isPending && <Skeleton className="mt-6 h-48 w-full" />}
      {requests.error && <ErrorState className="mt-6" message={requests.error.message} onRetry={requests.refetch} />}

      {requests.data && (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
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

          {selected ? <OptionsPanel key={selected.id} orgId={orgId} request={selected} /> : <ChooseAnOffer />}
        </div>
      )}
    </div>
  );
}

export default SwapsPage;
