// useLoginAttempt.js
// What happens when the login form is submitted: sign in, then go on to
// where the user was heading - or say, inline, why not.
//
// A 429 gets special treatment: after too many wrong passwords the account
// itself is locked, so the button stays disabled until the wait named in the
// message has elapsed.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useCountdown } from '../../../hooks/useCountdown.js';
import { parseLockoutSeconds } from './lockoutWait.js';

const GENERIC_FAILURE = 'Invalid email or password.';

/**
 * next is a path already checked by safeReturnPath, or null for the app. A
 * single attempt may name its own destination instead - one RequireGuest has
 * been told too, since it decides where a sign-in lands (see its comment).
 */
export function useLoginAttempt(next) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { login } = useAuth();
  const { secondsLeft, start } = useCountdown();
  const navigate = useNavigate();

  async function attempt(email, password, destination = next) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      // replace: pressing Back on the invite page should not land on a login form.
      navigate(destination ?? '/app', { replace: true });
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

  return { attempt, isSubmitting, errorMessage, secondsLeft };
}
