// useRegistration.js
// What happens when the sign-up form is submitted.
//
// Supabase sends a confirmation email, and the account works once its link
// is followed - so on success the form says "check your email" (sentTo).
// The link comes back to /auth/callback carrying any ?next= (an invite,
// say), so confirming lands where the person started. A project that does
// not ask for confirmation signs them straight in instead.
//
// For privacy, Supabase answers the same whether or not the email already
// has an account: the email itself tells its owner what to do.

import { useState } from 'react';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

/** next is a path already checked by safeReturnPath, or null. */
export function useRegistration(next) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const { register } = useAuth();
  const { showToast } = useToast();

  async function submit({ name, email, password }) {
    setIsSubmitting(true);

    try {
      const { needsConfirmation } = await register({ name, email, password, next });
      if (needsConfirmation) setSentTo(email);
    } catch (err) {
      showToast({ type: 'error', title: 'Sign-up failed', message: err.message || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting, sentTo };
}
