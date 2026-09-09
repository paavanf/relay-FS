// SaveRulesBar - the save action for the scheduling rules.
//
// Only managers see it at all, and it stays disabled until something has
// actually changed, so a stray click cannot rewrite the rules with the same
// values and make it look like a policy change in the audit trail.
import { Button } from '../../../components/ui/Button.jsx';

export function SaveRulesBar({ isDirty, isSaving, onSave }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {isDirty && <p className="text-body-sm text-content-tertiary">Unsaved changes.</p>}

      <Button onClick={onSave} disabled={!isDirty} isLoading={isSaving}>
        Save rules
      </Button>
    </div>
  );
}
