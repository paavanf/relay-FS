// SwapsEmptyStates - the Swaps page's two "nothing here yet" panels:
//
//   NoOffers       under My offers, before someone has offered anything -
//                  offering happens on My shifts, so it links there
//   ChooseAnOffer  where the options will appear, until an offer is chosen
//                  (wide screens only: on a phone it would only repeat the
//                  list above it)
import { ArrowLeftRight, MousePointerClick } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';

export function NoOffers({ orgId }) {
  return (
    <Card>
      <EmptyState
        icon={ArrowLeftRight}
        title="You have not offered any shifts"
        description="Offer a shift you cannot work from My shifts, then come back here to find swaps for it."
        action={
          <ButtonLink to={`/app/${orgId}/my-shifts`} variant="secondary" size="sm">
            Go to My shifts
          </ButtonLink>
        }
      />
    </Card>
  );
}

export function ChooseAnOffer() {
  return (
    <Card className="hidden lg:block">
      <EmptyState
        icon={MousePointerClick}
        title="Choose an offer"
        description="Choose Find swaps on an offer to see who could take that shift, directly or round a chain of people."
      />
    </Card>
  );
}
