// InviteWrongAccount - signed in, but not as the person the invite was sent to.
//
// Accepting would be refused (the server checks the address), so the page
// says whose invite it is and offers to switch. Logging out turns this into
// the signed-out view, which leads to Log in and Create account for the
// invited address with the invite carried along.
import { useState } from 'react';
import { Link } from 'react-router';
import { UserX } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { InviteHeading } from './InviteHeading.jsx';
import { InviteSummary } from './InviteSummary.jsx';

export function InviteWrongAccount({ invite, userEmail }) {
  const { logout } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  async function switchAccount() {
    setIsSwitching(true);
    await logout();
  }

  return (
    <div>
      <InviteHeading icon={UserX} title="This invite is for someone else">
        It was sent to {invite.email}, but you are signed in as {userEmail}.
      </InviteHeading>

      <InviteSummary invite={invite} />

      <p className="mt-5 text-body-sm text-content-secondary">
        To accept it, sign in as{' '}
        <span className="font-medium text-content-primary">{invite.email}</span>, or create an
        account with that address.
      </p>

      <Button size="lg" className="mt-4 w-full" isLoading={isSwitching} onClick={switchAccount}>
        Log out and switch account
      </Button>

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/app" className="font-medium text-brand-solid hover:text-brand-content">
          Stay signed in as {userEmail}
        </Link>
      </p>
    </div>
  );
}
