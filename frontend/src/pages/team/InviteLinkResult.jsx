// InviteLinkResult - shows the generated invite link with a copy button.
//
// Invites are not emailed yet, so the link has to be shared by hand. It is
// the only copy: the server stores a hash of it and cannot show it again.
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';

export function InviteLinkResult({ invite }) {
  const [copied, setCopied] = useState(false);

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
    <div className="rounded-lg border border-line bg-surface-sunken p-4">
      <p className="text-[13px] font-medium text-ink">Invite created for {invite.email}</p>
      <p className="mt-1 text-xs text-ink-muted">
        Send them this link. It expires in 72 hours and can be used once.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="data flex-1 truncate rounded-md border border-line bg-surface-raised px-2.5 py-1.5 text-xs text-ink-muted">
          {invite.inviteLink}
        </code>

        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
