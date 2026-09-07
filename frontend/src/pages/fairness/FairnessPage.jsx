// FairnessPage - who has been carrying the unpopular shifts.
import PlaceholderPage from '../placeholders/index.js';

function FairnessPage() {
  return (
    <PlaceholderPage
      title="Fairness"
      description="Track how the awkward shifts are shared out over time."
      capabilities={[
        'See how nights, weekends, and holidays are distributed',
        'Compare your own share against the team average',
        'Watch the balance even out across a rostering period',
        'Understand why the scheduler gave a shift to one person over another',
      ]}
    />
  );
}

export default FairnessPage;
