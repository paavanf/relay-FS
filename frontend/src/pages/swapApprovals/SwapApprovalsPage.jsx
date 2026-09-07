// SwapApprovalsPage - the manager queue for approving swaps.
import PlaceholderPage from '../placeholders/index.js';

function SwapApprovalsPage() {
  return (
    <PlaceholderPage
      title="Swap approvals"
      description="Review and decide on swaps the team has proposed."
      capabilities={[
        'Work through swaps waiting on a manager decision',
        'See exactly what each swap changes before approving it',
        'Get warned when a swap breaks coverage or qualifications',
        'Approve a whole swap chain in one go, or reject it with a reason',
      ]}
    />
  );
}

export default SwapApprovalsPage;
