// TeamPage - the people in this organisation, the invites still waiting, and
// the ways to change both. Managers and owners only; the route enforces it.
//
// The page shows only the actions this viewer may take. That is courtesy,
// not security: the server checks every change itself.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { MembersTable } from './MembersTable.jsx';
import { PendingInvites } from './PendingInvites.jsx';
import { InviteMemberDialog } from './InviteMemberDialog.jsx';
import { EditMemberDialog } from './EditMemberDialog.jsx';
import { DeactivateMemberDialog } from './DeactivateMemberDialog.jsx';
import { mayDeactivate } from './memberChanges.js';
import { listMembers } from '../../features/organisation/api/members.js';
import { listQualifications } from '../../features/catalog/api/qualifications.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useAuth } from '../../features/auth/useAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function TeamPage() {
  const { orgId, isOwner } = useOrg();
  const { user } = useAuth();
  useDocumentTitle('Team');

  // The open dialog, as { kind: 'invite' | 'edit' | 'deactivate', member }, or null.
  const [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);

  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => listMembers(orgId) });
  const qualifications = useQuery({ queryKey: ['qualifications', orgId], queryFn: () => listQualifications(orgId) });
  const qualificationList = qualifications.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Team"
        description="The people in this organisation, what they are qualified for, and the hours they are contracted to work."
        actions={
          <Button onClick={() => setDialog({ kind: 'invite' })}>
            <UserPlus className="size-4" />
            Invite member
          </Button>
        }
      />

      <div className="mt-6">
        {members.isPending && <Skeleton className="h-40 w-full" />}
        {members.isError && <ErrorState message={members.error.message} onRetry={members.refetch} />}
        {members.data && (
          <MembersTable
            members={members.data}
            qualifications={qualificationList}
            canDeactivate={(member) => mayDeactivate({ member, viewerUserId: user.id, viewerIsOwner: isOwner })}
            onEdit={(member) => setDialog({ kind: 'edit', member })}
            onDeactivate={(member) => setDialog({ kind: 'deactivate', member })}
          />
        )}
      </div>

      <PendingInvites orgId={orgId} />

      {dialog?.kind === 'invite' && <InviteMemberDialog onClose={close} />}
      {dialog?.kind === 'edit' && (
        <EditMemberDialog member={dialog.member} qualifications={qualificationList} onClose={close} />
      )}
      {dialog?.kind === 'deactivate' && <DeactivateMemberDialog member={dialog.member} onClose={close} />}
    </div>
  );
}

export default TeamPage;
