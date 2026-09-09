// useAssignMutations - saving and clearing a cell.
//
// Every mutation invalidates the roster query, so the grid redraws from the
// server rather than from a guess. Correctness matters more than the few
// hundred milliseconds an optimistic update would save: a grid showing a
// shift the server rejected is worse than one that takes a moment.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../../../features/roster/api/assignments.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useAssignMutations({ rosterId, onDone }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  function settle(title) {
    queryClient.invalidateQueries({ queryKey: ['roster', orgId, rosterId] });
    showToast({ type: 'success', title });
    onDone?.();
  }

  const onError = (err) =>
    showToast({ type: 'error', title: 'Could not save', message: err.message });

  const saving = useMutation({
    mutationFn: ({ assignment, membershipId, shiftTemplateId, date }) =>
      assignment
        ? updateAssignment(orgId, assignment.id, { shiftTemplateId })
        : createAssignment(orgId, { rosterId, membershipId, shiftTemplateId, date }),
    onSuccess: () => settle('Shift saved'),
    onError,
  });

  const clearing = useMutation({
    mutationFn: (assignmentId) => deleteAssignment(orgId, assignmentId),
    onSuccess: () => settle('Shift cleared'),
    onError,
  });

  return {
    save: saving.mutate,
    clear: clearing.mutate,
    isSaving: saving.isPending || clearing.isPending,
  };
}
