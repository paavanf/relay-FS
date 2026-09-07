// TeamPage - managing the people in the organisation. Managers and owners only.
import PlaceholderPage from '../placeholders/index.js';

function TeamPage() {
  return (
    <PlaceholderPage
      title="Team"
      description="The people in this organisation, and what they are qualified for."
      capabilities={[
        'Invite new people by email and track pending invites',
        'Change someone from member to manager, or back again',
        'Record the qualifications each person holds',
        'Remove someone who has left the team',
      ]}
    />
  );
}

export default TeamPage;
