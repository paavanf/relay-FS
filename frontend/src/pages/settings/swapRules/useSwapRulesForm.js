// useSwapRulesForm - loading, editing and saving the swap rules, so the
// section itself only renders. All three rules are sent together, as the
// server requires.
//
// Like the scheduling rules, `edited` stays null until someone changes
// something, and the shown values are derived from it - never copied into
// state by an effect, which would paint empty fields first.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSwapRules } from '../../../features/organisation/api/swapRules.js';
import { useSwapRules, chainKeys } from '../../../features/swaps/hooks/useSwapChains.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { validateSwapRules, swapRulesChanged } from './swapRuleFields.js';

export function useSwapRulesForm() {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [edited, setEdited] = useState(null);
  const [errors, setErrors] = useState({});

  const query = useSwapRules(orgId);
  const values = edited ?? query.data ?? {};

  const mutation = useMutation({
    mutationFn: () => updateSwapRules(orgId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.rules(orgId) });
      setEdited(null);
      setErrors({});
      showToast({ type: 'success', title: 'Swap rules saved' });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  function handleChange(name, value) {
    setEdited({ ...values, [name]: value });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSave() {
    const found = validateSwapRules(values);
    setErrors(found);
    if (Object.keys(found).length === 0) mutation.mutate();
  }

  return {
    query,
    values,
    errors,
    isDirty: edited !== null && swapRulesChanged(edited, query.data),
    isSaving: mutation.isPending,
    handleChange,
    handleSave,
  };
}
