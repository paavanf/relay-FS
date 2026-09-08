// InviteLinkResult - shows the generated invite link with a copy button.
//
// The link is always shown, whether or not the email went out. It is the only
// copy: the server stores a hash of it and cannot show it again. Email is an
// addition on top, so the two states differ only in emphasis - when the email
// was sent the link becomes the secondary option rather than disappearing.
import { useState } from 'react';
import { Check, Copy, MailCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';

export function InviteLinkResult({ invite }) {
  const [copied, setCopied] = useState(false);
  const emailSent = invite.emailSent === true;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(invite.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is on screen to copy by hand.
    }
  }

  return (
    <div className="rounded-md border border-line-subtle bg-surface-sunken p-4">
      {emailSent ? (
        <p className="flex items-center gap-2 text-body-sm font-medium text-content-primary">
          <MailCheck className="size-4 text-success-content" aria-hidden="true" />
          We emailed the invite to {invite.email}.
        </p>
      ) : (
        <p className="text-body-sm font-medium text-content-primary">
          Invite created for {invite.email}
        </p>
      )}

      <p className="mt-1 text-xs text-content-secondary">
        {emailSent
          ? 'Or share this link directly. It expires in 72 hours and can be used once.'
          : 'Send them this link. It expires in 72 hours and can be used once.'}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="data flex-1 truncate rounded-sm border border-line-subtle bg-surface-raised px-2.5 py-1.5 text-xs text-content-secondary">
          {invite.inviteLink}
        </code>

        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Informational, not an error: sharing the link is a complete answer,
          and nothing has gone wrong if email was never set up. */}
      {!emailSent && (
        <p className="mt-3 text-xs text-content-tertiary">
          Email delivery isn&apos;t configured, so the invite wasn&apos;t sent automatically.
        </p>
      )}
    </div>
  );
}
