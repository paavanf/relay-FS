// SaveRulesBar - the save action for the scheduling rules.
//
// Only managers see it at all, and it stays disabled until something has
// actually changed, so a stray click cannot rewrite the rules with the same
// values and make it look like a policy change in the audit trail. In the
// shared demo organisation it is locked (features/demo/DemoLock.jsx).
import { Button } from '../../../components/ui/Button.jsx';
import { DemoLock } from '../../../features/demo/DemoLock.jsx';

export function SaveRulesBar({ isDirty, isSaving, onSave }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {isDirty && <p className="text-body-sm text-content-tertiary">Unsaved changes.</p>}

      <DemoLock>
        <Button onClick={onSave} disabled={!isDirty} isLoading={isSaving}>
          Save rules
        </Button>
      </DemoLock>
    </div>
  );
}
