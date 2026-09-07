// MyShiftsPage - just the shifts belonging to the logged-in user.
import PlaceholderPage from '../placeholders/index.js';

function MyShiftsPage() {
  return (
    <PlaceholderPage
      title="My shifts"
      description="Everything you personally are rostered on for."
      capabilities={[
        'See your upcoming shifts in date order',
        'Check start and end times, location, and role',
        'Start a swap request straight from a shift',
        'Look back over the shifts you have already worked',
      ]}
    />
  );
}

export default MyShiftsPage;
