// InviteSummary - the facts of an invite as a short list: which organisation,
// what role, who sent it, to which address, and until when it works.
import { roleName, formatExpiry } from './inviteWords.js';

export function InviteSummary({ invite }) {
  const rows = [
    ['Organisation', invite.orgName],
    ['Role', roleName(invite.role)],
    ['Invited by', invite.inviterName],
    ['Sent to', invite.email],
    ['Expires', formatExpiry(invite.expiresAt)],
  ].filter(([, value]) => Boolean(value));

  return (
    <dl className="mt-5 divide-y divide-line-subtle rounded-md border border-line-subtle bg-surface-raised">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 px-3 py-2 text-body-sm">
          <dt className="shrink-0 text-content-secondary">{label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-content-primary" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
