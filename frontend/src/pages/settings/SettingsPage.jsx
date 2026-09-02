// SettingsPage - organisation settings. Managers and owners only.
import PlaceholderPage from '../placeholders/index.js';

function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="How this organisation rosters, and the rules the scheduler follows."
      milestone={2}
      capabilities={[
        'Set the timezone and the day the rostering week starts on',
        'Define shift templates for the patterns you run regularly',
        'Set coverage requirements for each shift and role',
        'Choose how much weight fairness carries when generating a roster',
      ]}
    />
  );
}

export default SettingsPage;
