// InviteUnavailable - the invite cannot be shown.
//
// A 404 means the link has expired, been used, been withdrawn, or never
// existed. The server gives the same answer for all four on purpose, so the
// page does not guess which. A 422 is a link too mangled to look up, which
// leaves the reader in the same place. Anything else is a failure to load,
// with a retry.
import { Link } from 'react-router';
import { MailX } from 'lucide-react';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { InviteHeading } from './InviteHeading.jsx';

export function InviteUnavailable({ error, onRetry }) {
  if (error.status !== 404 && error.status !== 422) {
    return <ErrorState title="Could not load this invite" message={error.message} onRetry={onRetry} />;
  }

  return (
    <div>
      <InviteHeading icon={MailX} muted title="This invite is no longer valid">
        It may have expired, been used already, or been withdrawn. Ask the person who invited you
        to send a new one.
      </InviteHeading>

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/" className="font-medium text-brand-solid hover:text-brand-content">
          Go to Relay
        </Link>
      </p>
    </div>
  );
}
