// AssignDialogFooter - the actions under the assign dialog.
//
// Save stays disabled until the validation says the edit is legal: the server
// would refuse it anyway, and a button that explains beats one that fails.
import { Button } from '../../../components/ui/Button.jsx';

export function AssignDialogFooter({ assignment, canSave, isSaving, onClear, onSave, onClose }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-subtle px-5 py-3">
      {assignment ? (
        <Button variant="danger" size="sm" onClick={onClear} isLoading={isSaving}>
          Clear shift
        </Button>
      ) : (
        <span />
      )}

      <span className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" isLoading={isSaving} disabled={!canSave} onClick={onSave}>
          Save
        </Button>
      </span>
    </div>
  );
}
