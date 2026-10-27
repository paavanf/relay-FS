// useResetLinkRequest - asking for a password reset link, and asking again.
// Both share the request, the cooldown before another, and the error
// handling. Supabase sends the email; its link comes back to
// /reset-password signed in for long enough to choose a new password.
//
// The cooldown matches Supabase's own: one email to an address a minute.
import { useState } from 'react';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { useCountdown } from '../../../hooks/useCountdown.js';

const RESEND_COOLDOWN_SECONDS = 60;

export function useResetLinkRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { showToast } = useToast();
  const { secondsLeft, start } = useCountdown();

  async function sendLink(email, { isResend }) {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setIsSent(true);
      start(RESEND_COOLDOWN_SECONDS);
      if (isResend) showToast({ type: 'success', title: 'Link sent again' });
    } catch (err) {
      showToast({ type: 'error', title: 'Could not send the link', message: err.message || 'Please try again in a moment.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { sendLink, isSubmitting, isSent, secondsLeft };
}
