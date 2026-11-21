// useLoginAttempt.js
// What happens when the login form is submitted: sign in, then go on to
// where the user was heading - or say, inline, why not.
//
// The messages come from lib/auth/authErrors.js: a wrong email and a wrong
// password read the same, so a failed login never hints whether an address
// has an account. A refusal from Relay itself - an existing account that
// cannot be linked yet, say - is shown in its own words.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../features/auth/useAuth.js';

const GENERIC_FAILURE = 'Sign-in failed. Please try again.';

/**
 * next is a path already checked by safeReturnPath, or null for the app. A
 * single attempt may name its own destination instead - one RequireGuest has
 * been told too, since it decides where a sign-in lands (see its comment).
 */
export function useLoginAttempt(next) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function attempt(email, password, destination = next) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      // replace: pressing Back on the invite page should not land on a login form.
      navigate(destination ?? '/app', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || GENERIC_FAILURE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { attempt, isSubmitting, errorMessage };
}
