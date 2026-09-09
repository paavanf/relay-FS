// useAssignValidation - the dry run behind the assign dialog.
//
// Re-checks whenever the chosen shift changes, and throws away answers that
// arrive after a newer question was asked - otherwise clicking through three
// shifts quickly could leave the first shift's verdict on screen.
import { useState, useEffect } from 'react';
import { validateAssignment } from '../../../features/roster/api/assignments.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function useAssignValidation({ rosterId, membershipId, shiftTemplateId, date, ignoreAssignmentId }) {
  const { orgId } = useOrg();
  const [result, setResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!shiftTemplateId) {
      setResult(null);
      return undefined;
    }

    let current = true;
    setIsChecking(true);

    validateAssignment(orgId, { rosterId, membershipId, shiftTemplateId, date, ignoreAssignmentId })
      .then((answer) => current && setResult(answer))
      .catch((err) => current && setResult({ allowed: false, violations: [{ code: 'ERROR', message: err.message, assignmentIds: [] }] }))
      .finally(() => current && setIsChecking(false));

    return () => {
      current = false;
    };
  }, [orgId, rosterId, membershipId, shiftTemplateId, date, ignoreAssignmentId]);

  return { result, isChecking };
}
