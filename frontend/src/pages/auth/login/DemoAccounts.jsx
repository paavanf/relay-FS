// DemoAccounts - "Try the demo" on the login page: the shared demo's three
// accounts, each with what it shows and a button that signs straight in -
// past the organisation chooser, onto the page in the demo organisation
// where that account's story is. Only in a build made with VITE_DEMO_MODE=true
// (features/demo/demoMode.js).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button.jsx';
import { LoginError } from './LoginError.jsx';
import { useLoginAttempt } from './useLoginAttempt.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_ORG_ID } from './demoAccounts.js';

export function DemoAccounts() {
  const { attempt, isSubmitting, errorMessage, secondsLeft } = useLoginAttempt(null);
  const [chosen, setChosen] = useState(null);
  const navigate = useNavigate();

  // RequireGuest decides where a sign-in lands, from the page the visitor was
  // heading for - so that is set to the account's page first, then signed in.
  function signInAs(account) {
    const destination = `/app/${DEMO_ORG_ID}/${account.page}`;
    setChosen(account.email);
    navigate('/login', { replace: true, state: { from: destination } });
    attempt(account.email, DEMO_PASSWORD, destination);
  }

  return (
    <section aria-labelledby="try-the-demo" className="mb-8 rounded-lg border border-line-subtle bg-surface-raised p-4">
      <h2 id="try-the-demo" className="text-h3 text-content-primary">
        Try the demo
      </h2>
      <p className="mt-1 mb-3 text-body-sm text-content-secondary">
        A shared hospital ward with real rosters and swaps. It resets every night, and some settings are locked.
      </p>
      <LoginError message={errorMessage} secondsLeft={secondsLeft} />

      <ul className="mt-3 divide-y divide-line-subtle">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-content-primary">{account.who}</p>
              <p className="text-xs text-content-secondary">{account.sees}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
              isLoading={isSubmitting && chosen === account.email}
              disabled={isSubmitting}
              onClick={() => signInAs(account)}
              aria-label={`Sign in as ${account.who.toLowerCase()}`}
            >
              Sign in
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
