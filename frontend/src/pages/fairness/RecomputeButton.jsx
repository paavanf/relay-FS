// RecomputeButton - rebuilds the fairness ledger from the published rosters,
// now. Managers and owners only; the server refuses anyone else.
//
// Publishing already triggers a recompute. This is for rosters published
// before fairness was measured, or for checking after something changed.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { recomputeFairness } from '../../features/fairness/api/fairness.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { formatWindow } from './fairnessWords.js';

export function RecomputeButton() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () => recomputeFairness(orgId),
    onSuccess: (data) => {
      queryClient.setQueryData(['fairness', orgId], data);
      showToast({
        type: 'success',
        title: 'Fairness recomputed',
        message: data.window ? `Measured over ${formatWindow(data.window)}.` : 'No roster has been published yet.',
      });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not recompute', message: err.message }),
  });

  return (
    <Button variant="secondary" size="sm" isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
      {!mutation.isPending && <RefreshCw className="size-4" aria-hidden="true" />}
      Recompute
    </Button>
  );
}
