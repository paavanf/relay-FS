// RegisterForm.jsx - name, email, and password form.
// useRegistration creates the account and moves on to the login page. An
// invite link arrives with the address it was sent to, pre-filled here.
import { useState } from 'react';
import { Link } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { PasswordInput } from '../../../components/ui/PasswordInput.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Callout, calloutLinkStyles } from '../../../components/ui/Callout.jsx';
import { useRegistration, DUPLICATE_MESSAGE } from './useRegistration.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';
import { authPath } from '../../../lib/returnPath.js';

export function RegisterForm() {
  const { next, email: invitedEmail } = useReturnPath();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const { submit, isSubmitting, isDuplicate } = useRegistration(next);

  function handleSubmit(event) {
    event.preventDefault();
    submit({ name, email, password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ana Ramirez"
        autoComplete="name"
        autoFocus={Boolean(invitedEmail)}
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        error={isDuplicate ? DUPLICATE_MESSAGE : undefined}
        required
      />

      {isDuplicate && (
        <Callout variant="warning">
          Already have an account?{' '}
          <Link to={authPath('/login', { next })} state={{ prefillEmail: email }} className={calloutLinkStyles}>
            Log in instead
          </Link>
        </Callout>
      )}

      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters, with a letter and a number"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
