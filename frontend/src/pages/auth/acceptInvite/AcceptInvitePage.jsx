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
    <Card tilt>
      <CardContent className="pt-8 text-center">
        <div className="relative mx-auto mb-5 w-fit">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/40 blur-xl" aria-hidden="true" />
          <div className="relative rounded-2xl border border-white/14 bg-white/7 p-3.5">
            <MailCheck className="size-6 text-indigo-200" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-aurora text-2xl font-semibold tracking-tight">You have an invite</h1>

        <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-ink-soft">
          We found your invite link, but joining an organisation isn&apos;t wired up yet.
        </p>

        <div className="mt-5">
          <Badge variant="amber">Coming in Milestone 1</Badge>
        </div>

        {/* Showing the token confirms the route param is being read correctly. */}
        <p className="mt-5 truncate rounded-lg border border-white/8 bg-white/4 px-3 py-2 font-mono text-xs text-ink-faint">
          {token}
        </p>

        <Link
          to="/login"
          className="mt-7 inline-block text-sm font-medium text-indigo-300 transition-colors duration-300 hover:text-indigo-200"
        >
          Back to log in
        </Link>
      </CardContent>
    </Card>
  );
}

export default AcceptInvitePage;
