// useRegistration.js
// What happens when the sign-up form is submitted.
//
// Creating an account does not sign you in: on success the user goes to the
// login page, with their email pre-filled and any ?next= (an invite, say)
// carried along, so signing in takes them back to where they started.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { authPath } from '../../../lib/returnPath.js';

export const DUPLICATE_MESSAGE = 'This email is already registered. Try logging in instead.';

/** next is a path already checked by safeReturnPath, or null. */
export function useRegistration(next) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set when the API reports the email is taken (409), so the form can offer
  // a route out instead of just an error.
  const [isDuplicate, setIsDuplicate] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function submit({ name, email, password }) {
    setIsSubmitting(true);
    setIsDuplicate(false);

    try {
      await register(name, email, password);
      showToast({ type: 'success', title: 'Account created', message: 'Please log in with your new account' });
      navigate(authPath('/login', { next }), { state: { prefillEmail: email } });
    } catch (err) {
      const duplicate = err.status === 409;
      setIsDuplicate(duplicate);

      showToast({
        type: 'error',
        title: duplicate ? 'Email already registered' : 'Signup failed',
        message: duplicate ? DUPLICATE_MESSAGE : err.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting, isDuplicate };
}
