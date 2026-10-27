// ResetLinkSent - the confirmation shown after a reset link is requested.
//
// The wording stays deliberately non-committal ("if that email is
// registered"): confirming the address exists would let anyone test which
// emails have Relay accounts. The resend button is on a cooldown so it cannot
// be used to hammer the endpoint.
import { MailCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';

export function ResetLinkSent({ email, secondsLeft, isSending, onResend }) {
  const isCoolingDown = secondsLeft > 0;

  return (
    <div className="rounded-lg border border-line-subtle bg-surface-raised p-5">
      <MailCheck className="size-5 text-success-content" aria-hidden="true" />

      <p className="mt-3 text-sm font-medium text-content-primary">Check your inbox</p>

      <p className="mt-1 text-body-sm leading-relaxed text-content-secondary">
        If <span className="font-medium text-content-primary">{email}</span> has an account, we have sent a link to
        choose a new password. It expires in an hour.
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-line-subtle pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onResend}
          disabled={isCoolingDown}
          isLoading={isSending}
        >
          {isCoolingDown ? `Resend in ${secondsLeft}s` : 'Resend email'}
        </Button>

        <p className="text-body-sm text-content-tertiary">
          {isCoolingDown ? 'Give it a moment to arrive.' : "Didn't get it?"}
        </p>
      </div>
    </div>
  );
}
