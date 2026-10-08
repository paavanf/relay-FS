// PendingInvites - invites sent but not yet accepted, under the members table.
//
// Expired invites stay listed, marked as such, until someone revokes them:
// that is the one place a manager notices an invite went unanswered. Nothing
// is shown while there are none.
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { listInvites } from '../../features/organisation/api/invites.js';
import { PendingInviteRow } from './PendingInviteRow.jsx';

export function PendingInvites({ orgId }) {
  const { data, error, refetch } = useQuery({
    queryKey: ['invites', orgId],
    queryFn: () => listInvites(orgId),
  });

  if (error) return <ErrorState className="mt-8" title="Could not load pending invites" message={error.message} onRetry={refetch} />;
  if (!data || data.length === 0) return null;

  return (
    <section aria-labelledby="pending-invites" className="mt-8 space-y-3">
      <div>
        <h2 id="pending-invites" className="text-h3 text-content-primary">
          Pending invites
        </h2>
        <p className="mt-1 text-body-sm text-content-secondary">
          Waiting for someone to open the link and sign in with the address it was sent to.
        </p>
      </div>

      <Card>
        <ul className="divide-y divide-line-subtle">
          {data.map((invite) => (
            <PendingInviteRow key={invite.id} orgId={orgId} invite={invite} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
