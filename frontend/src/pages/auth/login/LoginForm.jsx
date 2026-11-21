// LoginForm - "Continue with Google", then the email + password form.
// Plain useState, no form library: easier to read while learning.
//
// Failures are shown inline rather than as a toast, because the thing that
// went wrong is a property of this form. useLoginAttempt does the signing in
// and sends the user on - to a safe ?next= such as an invite, or the app.
import { useState } from 'react';
import { useLocation } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { PasswordInput } from '../../../components/ui/PasswordInput.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LoginError } from './LoginError.jsx';
import { GoogleSignIn } from './GoogleSignIn.jsx';
import { useLoginAttempt } from './useLoginAttempt.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';

export function LoginForm() {
  const location = useLocation();
  const { next, email: invitedEmail } = useReturnPath();

  // Someone arriving from the register page brings their email with them,
  // and an invite link brings the address it was sent to, so neither has to
  // type it again.
  const prefillEmail = location.state?.prefillEmail || invitedEmail;

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const { attempt, isSubmitting, errorMessage } = useLoginAttempt(next);

  function handleSubmit(event) {
    event.preventDefault();
    attempt(email, password);
  }

  return (
    <>
      <GoogleSignIn next={next} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <LoginError message={errorMessage} />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          // A pre-filled email means the password is all that is left to type.
          autoFocus={Boolean(prefillEmail)}
          required
        />

        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Log in
        </Button>
      </form>
    </>
  );
}
