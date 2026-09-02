// AvailabilityPage - when the user can and cannot work.
import PlaceholderPage from '../placeholders/index.js';

function AvailabilityPage() {
  return (
    <PlaceholderPage
      title="Availability"
      description="Tell Relay when you can work, so the roster respects it."
      milestone={2}
      capabilities={[
        'Set the hours you are normally available each week',
        'Add one-off exceptions for holidays and appointments',
        'Mark hard blocks that the scheduler must never override',
        'See how your availability affects what you get rostered',
      ]}
    />
  );
}

export default AvailabilityPage;
