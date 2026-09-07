// TeamPage - the people in this organisation, and a way to invite more.
// Managers and owners only; the route already enforces that.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { MembersTable } from './MembersTable.jsx';
import { InviteMemberDialog } from './InviteMemberDialog.jsx';
import { listMembers } from '../../features/organisation/api/members.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function TeamPage() {
  const { orgId } = useOrg();
  const [isInviting, setIsInviting] = useState(false);
  useDocumentTitle('Team');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => listMembers(orgId),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Team"
        description="The people in this organisation, and what they are qualified for."
        actions={
          <Button onClick={() => setIsInviting(true)}>
            <UserPlus className="size-4" />
            Invite member
          </Button>
        }
      />

      <div className="mt-6">
        {isPending && <Skeleton className="h-40 w-full" />}

        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {data &&
          (data.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No members yet"
                description="Invite someone to get started."
              />
            </Card>
          ) : (
            <MembersTable members={data} />
          ))}
      </div>

      {isInviting && <InviteMemberDialog onClose={() => setIsInviting(false)} />}
    </div>
  );
}

export default TeamPage;
