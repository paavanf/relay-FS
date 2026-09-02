// AcceptInvitePage - where an invite link lands.
// Accepting invites needs backend endpoints that arrive in Milestone 1, so for
// now we confirm the link was read and explain what happens next.
import { Link, useParams } from 'react-router';
import { MailCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function AcceptInvitePage() {
  const { token } = useParams();
  useDocumentTitle('Accept invite');

  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-indigo-50 p-3">
          <MailCheck className="size-6 text-indigo-600" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-slate-900">You have an invite</h1>

        <p className="mt-2 text-sm text-slate-500">
          We found your invite link, but joining an organisation isn&apos;t wired up yet.
        </p>

        <div className="mt-4">
          <Badge variant="amber">Coming in Milestone 1</Badge>
        </div>

        {/* Showing the token confirms the route param is being read correctly. */}
        <p className="mt-4 truncate font-mono text-xs text-slate-400">Invite token: {token}</p>

        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Back to log in
        </Link>
      </CardContent>
    </Card>
  );
}

export default AcceptInvitePage;
