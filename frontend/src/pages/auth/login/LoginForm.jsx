// LoginForm - email + password form.
// Plain useState, no form library: easier to read while learning.
//
// Failures are shown inline rather than as a toast, because the thing that
// went wrong is a property of this form. A 429 gets special treatment: after
// too many wrong passwords the account itself is locked, so the button stays
// disabled until the wait named in the message has elapsed.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LoginError } from './LoginError.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useCountdown } from '../../../hooks/useCountdown.js';
import { parseLockoutSeconds, formatWait } from './lockoutWait.js';

const GENERIC_FAILURE = 'Invalid email or password.';

export function LoginForm() {
  const location = useLocation();

  // Someone arriving straight from the register page brings their email with
  // them, so they don't have to type it twice.
  const prefillEmail = location.state?.prefillEmail || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { login } = useAuth();
  const { secondsLeft, start } = useCountdown();
  const navigate = useNavigate();

  const isLockedOut = secondsLeft > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      const isRateLimited = err.status === 429;

      // Only a rate-limited response carries a real reason worth repeating.
      // Anything else stays generic, so a failed login never hints at
      // whether the email exists.
      setErrorMessage(isRateLimited ? err.message : GENERIC_FAILURE);

      if (isRateLimited) start(parseLockoutSeconds(err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <LoginError message={errorMessage} secondsLeft={secondsLeft} />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        autoComplete="current-password"
        // A pre-filled email means they just registered - focus the password.
        autoFocus={Boolean(prefillEmail)}
        required
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isLockedOut}
      >
        {isLockedOut ? `Locked for ${formatWait(secondsLeft)}` : 'Log in'}
      </Button>
    </form>
  );
}
