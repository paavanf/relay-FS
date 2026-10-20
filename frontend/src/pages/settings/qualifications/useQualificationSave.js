// useQualificationSave - saving a qualification from QualificationDialog:
// create, or update the one being edited, then refresh the list, say so,
// and close the dialog. A failure is said in a toast and the dialog stays.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQualification, updateQualification } from '../../../features/catalog/api/qualifications.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useQualificationSave(qualification, onClose) {
  const isEdit = Boolean(qualification);
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => (isEdit ? updateQualification(orgId, qualification._id, data) : createQualification(orgId, data)),
    onSuccess: () => {
      // Refetch the list so the table shows the change immediately.
      queryClient.invalidateQueries({ queryKey: ['qualifications', orgId] });
      showToast({ type: 'success', title: isEdit ? 'Changes saved' : 'Qualification added' });
      onClose();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });
}
