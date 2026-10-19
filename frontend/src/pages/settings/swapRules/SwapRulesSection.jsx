// SwapRulesSection - how swaps work in this organisation. Managers and
// owners change the rules here; everyone sees them, read-only, on the Swaps
// page. A swap already proposed keeps the rules it was proposed under - its
// deadline and whether it needs approval were decided then.
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { SaveRulesBar } from '../rosterRules/SaveRulesBar.jsx';
import { SwapRulesForm } from './SwapRulesForm.jsx';
import { useSwapRulesForm } from './useSwapRulesForm.js';

export function SwapRulesSection() {
  const { query, values, errors, isDirty, isSaving, handleChange, handleSave } = useSwapRulesForm();

  return (
    <div className="space-y-4">
      <Callout variant="info">
        These decide how swaps work from now on. A swap already proposed keeps the rules it was proposed under, and every swap is
        checked against the scheduling rules before it happens, whatever these say.
      </Callout>

      {query.isPending && <Skeleton className="h-48 w-full" />}
      {query.isError && <ErrorState message={query.error.message} onRetry={query.refetch} />}

      {query.data && (
        <>
          <Card>
            <CardContent>
              <SwapRulesForm values={values} errors={errors} onChange={handleChange} />
            </CardContent>
          </Card>
          <SaveRulesBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />
        </>
      )}
    </div>
  );
}
