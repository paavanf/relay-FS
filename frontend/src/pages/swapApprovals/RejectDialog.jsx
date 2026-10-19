// RejectDialog - rejecting a swap everyone has accepted, with an optional
// reason that reaches everyone in it. Rejecting calls the swap off: their
// shifts stay as they are, and their offers open again.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';

const REASON_MAX = 280;

export function RejectDialog({ names, isRejecting, onReject, onClose }) {
  const [reason, setReason] = useState('');

  function submit(event) {
    event.preventDefault();
    onReject(reason.trim());
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <form onSubmit={submit}>
          <div className="space-y-4 px-5 py-4">
            <div>
              <DialogTitle>Reject this swap?</DialogTitle>
              <DialogDescription>
                {names} keep the shifts they have now, and their offers open again. They are told it was rejected, and why if you say.
              </DialogDescription>
            </div>
            <Textarea
              label="Reason (optional)"
              value={reason}
              maxLength={REASON_MAX}
              rows={3}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Keep it
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isRejecting}>
              Reject swap
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
