// CheckYourEmail - shown once the sign-up form is sent: the account works
// after the link in the confirmation email is followed. The wording does not
// promise an account was made - for privacy, the answer is the same when the
// address already had one, and the email tells its owner what to do.
import { MailCheck } from 'lucide-react';

export function CheckYourEmail({ email }) {
  return (
    <div role="status" className="rounded-lg border border-line-subtle bg-surface-raised p-5">
      <MailCheck className="size-5 text-success-content" aria-hidden="true" />

      <p className="mt-3 text-sm font-medium text-content-primary">Check your email</p>

      <p className="mt-1 text-body-sm leading-relaxed text-content-secondary">
        We have sent a link to <span className="font-medium text-content-primary">{email}</span>. Follow it to
        confirm your address and finish signing up. It can take a minute to arrive - and check your spam folder.
      </p>
    </div>
  );
}
