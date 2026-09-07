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
    <div className="rounded-xl border border-line bg-surface-raised p-5">
      <MailCheck className="size-5 text-success" aria-hidden="true" />

      <p className="mt-3 text-sm font-medium text-ink">Check your inbox</p>

      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
        If <span className="font-medium text-ink">{email}</span> is registered, we have sent a reset
        link. It expires in an hour, and only the newest link works.
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={onResend}
          disabled={isCoolingDown}
          isLoading={isSending}
        >
          {isCoolingDown ? `Resend in ${secondsLeft}s` : 'Resend email'}
        </Button>

        <p className="text-[13px] text-ink-subtle">
          {isCoolingDown ? 'Give it a moment to arrive.' : "Didn't get it?"}
        </p>
      </div>
    </div>
  );
}
