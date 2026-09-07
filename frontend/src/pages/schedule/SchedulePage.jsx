// SchedulePage - the published roster for the whole team.
import PlaceholderPage from '../placeholders/index.js';

function SchedulePage() {
  return (
    <PlaceholderPage
      title="Schedule"
      description="The published roster for your whole team, week by week."
      capabilities={[
        'See every shift for the week in one grid, grouped by day',
        'Filter by role, qualification, or team member',
        'Spot uncovered shifts and coverage gaps at a glance',
        'Publish a draft roster so the team can see it',
      ]}
    />
  );
}

export default SchedulePage;
