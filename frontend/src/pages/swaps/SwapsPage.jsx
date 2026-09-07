// SwapsPage - shift swaps, including multi-party swap chains.
import PlaceholderPage from '../placeholders/index.js';

function SwapsPage() {
  return (
    <PlaceholderPage
      title="Swaps"
      description="Hand over a shift, or pick one up from someone else."
      capabilities={[
        'Offer a shift you cannot work to the rest of the team',
        'Browse shifts other people are trying to give away',
        'Build multi-party swap chains when no direct trade exists',
        'See which swaps would break a qualification or coverage rule',
      ]}
    />
  );
}

export default SwapsPage;
