// ReplaceWarningDialog - generating throws away what is already there.
//
// The count is spelled out rather than saying "the current draft", because
// "this will replace 43 shifts" is the sentence that makes someone pause.
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';

export function ReplaceWarningDialog({ assignmentCount, onConfirm, onClose }) {
  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="px-5 py-4">
          <DialogTitle>Replace the current draft?</DialogTitle>
          <DialogDescription>
            This roster already has {assignmentCount}{' '}
            {assignmentCount === 1 ? 'shift' : 'shifts'} on it. Generating replaces all of them,
            including anything assigned by hand.
          </DialogDescription>
        </div>

        <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Replace and generate
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
