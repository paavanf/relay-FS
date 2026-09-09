// RosterRulesSection - the working-time limits every roster is built against.
//
// Managers edit them; everyone else sees the same numbers read-only, because
// someone being scheduled under a limit should be able to check what it is.
// The data and form state live in useRosterRules.js.
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { RosterRulesForm } from './RosterRulesForm.jsx';
import { RulesImpactNote } from './RulesImpactNote.jsx';
import { SaveRulesBar } from './SaveRulesBar.jsx';
import { useRosterRules } from './useRosterRules.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

export function RosterRulesSection() {
  const { isManager } = useOrg();
  const { query, values, errors, isDirty, isSaving, handleChange, handleSave } = useRosterRules();

  return (
    <div className="space-y-4">
      <RulesImpactNote />

      {query.isPending && <Skeleton className="h-64 w-full" />}
      {query.isError && <ErrorState message={query.error.message} onRetry={query.refetch} />}

      {query.data && (
        <>
          <Card>
            <CardContent>
              <RosterRulesForm
                values={values}
                errors={errors}
                canEdit={isManager}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          {isManager && (
            <SaveRulesBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />
          )}
        </>
      )}
    </div>
  );
}
