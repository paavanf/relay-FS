// AcceptInvitePage - where an invite link lands.
// Joining an organisation needs endpoints that arrive in a later milestone, so
// for now this confirms the link was read and says what happens next.
import { Link, useParams } from 'react-router';
import { MailCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function AcceptInvitePage() {
  const { token } = useParams();
  useDocumentTitle('Accept invite');

  return (
    <div>
      <MailCheck className="size-5 text-brand-solid" aria-hidden="true" />

      <h1 className="mt-3 text-h1 tracking-[-0.01em] text-content-primary">
        You have an invite
      </h1>
      <p className="mt-1.5 text-sm text-content-secondary">
        We found your invite link, but joining an organisation is not wired up yet.
      </p>

      <div className="mt-4">
        <Badge variant="warning">In development</Badge>
      </div>

      {/* Showing the token confirms the route param is being read correctly. */}
      <p className="data mt-5 truncate rounded-md border border-line-subtle bg-surface-sunken px-3 py-2 text-xs text-content-tertiary">
        {token}
      </p>

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/login" className="font-medium text-brand-solid hover:text-brand-content">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default AcceptInvitePage;
