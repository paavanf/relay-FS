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
import { DemoLockedNote } from '../../../features/demo/DemoLockedNote.jsx';

export function RosterRulesSection() {
  const { isManager, isDemo } = useOrg();
  const { query, values, errors, isDirty, isSaving, handleChange, handleSave } = useRosterRules();

  return (
    <div className="space-y-4">
      <RulesImpactNote />
      <DemoLockedNote />

      {query.isPending && <Skeleton className="h-64 w-full" />}
      {query.isError && <ErrorState message={query.error.message} onRetry={query.refetch} />}

      {query.data && (
        <>
          <Card>
            <CardContent>
              {/* Locked in the shared demo: the fields show, but cannot change. */}
              <fieldset disabled={isDemo} className="m-0 min-w-0 border-0 p-0">
                <RosterRulesForm values={values} errors={errors} canEdit={isManager} onChange={handleChange} />
              </fieldset>
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
