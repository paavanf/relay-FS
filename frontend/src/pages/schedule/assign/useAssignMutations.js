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

  // A refused save usually means this grid is out of date - another manager
  // filled the cell a moment ago. Refetching shows what is really there, so
  // the reason in the toast points at a shift the manager can now see.
  const onError = (err) => {
    queryClient.invalidateQueries({ queryKey: ['roster', orgId, rosterId] });
    showToast({ type: 'error', title: 'Could not save', message: err.message });
  };

  // The role travels with the shift; a shift without roles sends none.
  const saving = useMutation({
    mutationFn: ({ assignment, membershipId, shiftTemplateId, slotQualificationId, date }) => {
      const role = slotQualificationId ? { slotQualificationId } : {};
      return assignment
        ? updateAssignment(orgId, assignment.id, { shiftTemplateId, ...role })
        : createAssignment(orgId, { rosterId, membershipId, shiftTemplateId, date, ...role });
    },
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
