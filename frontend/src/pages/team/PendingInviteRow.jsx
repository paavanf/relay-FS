// PendingInviteRow - one invite nobody has accepted yet.
//
// "Copy link" appears only for invites created in this tab: the server keeps
// just a hash of each link, so an older one cannot be shown again. Revoking
// makes the link stop working at once, whoever holds it.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { formatRelative } from '../../lib/formatDate.js';
import { revokeInvite } from '../../features/organisation/api/invites.js';
import { inviteLinkFor, forgetInviteLink } from '../../features/organisation/inviteLinks.js';
import { roleName } from '../auth/acceptInvite/inviteWords.js';

export function PendingInviteRow({ orgId, invite }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const link = invite.isExpired ? undefined : inviteLinkFor(invite.id);

  const revoke = useMutation({
    mutationFn: () => revokeInvite(orgId, invite.id),
    onSuccess: () => {
      forgetInviteLink(invite.id);
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
      showToast({ type: 'success', title: 'Invite revoked', message: `The link sent to ${invite.email} no longer works.` });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not revoke', message: err.message }),
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Could not copy', message: 'Your browser refused clipboard access.' });
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-content-primary">{invite.email}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-content-secondary">
          {roleName(invite.role)}
          <span aria-hidden="true">·</span>
          {invite.isExpired ? (
            <Badge variant="warning" size="sm">
              Expired
            </Badge>
          ) : (
            <span>Expires {formatRelative(invite.expiresAt)}</span>
          )}
        </p>
      </div>

      <div className="flex gap-1">
        {link && (
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        )}
        <Button variant="ghost" size="sm" isLoading={revoke.isPending} onClick={() => revoke.mutate()}>
          Revoke
        </Button>
      </div>
    </li>
  );
}
