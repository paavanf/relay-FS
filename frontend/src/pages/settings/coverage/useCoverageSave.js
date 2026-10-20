// useCoverageSave - saving a coverage rule from CoverageDialog: an upsert
// on (shift template, weekday), then refresh the rules, say so, and close.
// A failure is said in a toast and the dialog stays open.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertCoverage } from '../../../features/catalog/api/coverage.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useCoverageSave(onClose) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => upsertCoverage(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage', orgId] });
      showToast({ type: 'success', title: 'Coverage saved' });
      onClose();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });
}
