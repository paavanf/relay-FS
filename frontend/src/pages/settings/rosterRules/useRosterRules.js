// useRosterRules - loading, editing and saving the scheduling rules.
//
// Kept apart from the section so that file is only rendering. All three rules
// are always sent together: the server rejects a partial update, because a
// rule the scheduler cannot read is one it stops enforcing.
//
// `edited` is null until someone actually types, and the displayed values are
// derived from it rather than copied into state by an effect. Copying would
// paint once with empty fields - blank inputs, and an "unsaved changes" note
// against changes nobody had made - before the effect filled them in.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { validateRules, rulesHaveChanged } from './rules.js';
import { getRosterRules, updateRosterRules } from '../../../features/organisation/api/rosterRules.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function useRosterRules() {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [edited, setEdited] = useState(null);
  const [errors, setErrors] = useState({});

  const query = useQuery({
    queryKey: ['rosterRules', orgId],
    queryFn: () => getRosterRules(orgId),
  });

  const saved = query.data;
  const values = edited ?? saved ?? {};

  const mutation = useMutation({
    mutationFn: () => updateRosterRules(orgId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosterRules', orgId] });
      // Back to showing whatever the server now holds.
      setEdited(null);
      setErrors({});
      showToast({ type: 'success', title: 'Scheduling rules saved' });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  function handleChange(name, value) {
    setEdited({ ...values, [name]: value });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSave() {
    const found = validateRules(values);
    setErrors(found);
    if (Object.keys(found).length === 0) mutation.mutate();
  }

  return {
    query,
    values,
    errors,
    isDirty: edited !== null && rulesHaveChanged(edited, saved),
    isSaving: mutation.isPending,
    handleChange,
    handleSave,
  };
}
