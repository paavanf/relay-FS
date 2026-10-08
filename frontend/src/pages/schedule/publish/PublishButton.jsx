// PublishButton - turns a draft into the live roster.
//
// Only shown for drafts, and only to managers. A published roster has no
// publish button because there is nothing left to do to it.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { PublishDialog } from './PublishDialog.jsx';
import { publishRoster } from '../../../features/roster/api/rosters.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function PublishButton({ roster, assignmentCount, unfilledCount }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => publishRoster(orgId, roster.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters', orgId] });
      queryClient.invalidateQueries({ queryKey: ['roster', orgId, roster.id] });
      // Publishing recomputes the fairness ledger on the server.
      queryClient.invalidateQueries({ queryKey: ['fairness', orgId] });
      setIsOpen(false);
      showToast({ type: 'success', title: 'Roster published' });
    },
    onError: (err) =>
      showToast({ type: 'error', title: 'Could not publish', message: err.message }),
  });

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Send className="size-4" />
        Publish
      </Button>

      {isOpen && (
        <PublishDialog
          roster={roster}
          assignmentCount={assignmentCount}
          unfilledCount={unfilledCount}
          isPublishing={mutation.isPending}
          onConfirm={() => mutation.mutate()}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
