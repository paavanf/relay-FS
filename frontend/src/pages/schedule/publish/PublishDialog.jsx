// PublishDialog - confirm what is about to become real.
//
// Publishing is one-way and people plan their lives around the result, so the
// dialog states the range, the shift count, and above all how many shifts are
// still empty. Publishing with holes stays possible - sometimes it is the
// right call - but it must be a deliberate act, so it needs a tick.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Checkbox } from '../../../components/ui/Checkbox.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { formatShortDate } from '../format.js';

export function PublishDialog({ roster, assignmentCount, unfilledCount, isPublishing, onConfirm, onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const hasHoles = unfilledCount > 0;

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="px-5 py-4">
          <DialogTitle>Publish {roster.name}?</DialogTitle>
          <DialogDescription>
            {formatShortDate(roster.startDate)} to {formatShortDate(roster.endDate)}, with{' '}
            {assignmentCount} {assignmentCount === 1 ? 'shift' : 'shifts'} assigned. Everyone in
            the organisation will be able to see it, and it can no longer be edited directly.
          </DialogDescription>

          {hasHoles && (
            <div className="mt-4 space-y-3">
              <Callout variant="warning">
                {unfilledCount} {unfilledCount === 1 ? 'shift is' : 'shifts are'} still unfilled.
                Publishing now means going live with {unfilledCount === 1 ? 'that gap' : 'those gaps'}.
              </Callout>

              <Checkbox
                label="I understand, publish anyway"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            isLoading={isPublishing}
            disabled={hasHoles && !acknowledged}
            onClick={onConfirm}
          >
            Publish
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
