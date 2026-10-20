// useResetLinkRequest - asking for a password reset link, and asking again.
// Both share the request, the cooldown before another, and the error
// handling; a resend also says the earlier link has stopped working. A
// refusal - including the limit on reset emails per address, which says when
// to try again - is shown as it came.
import { useState } from 'react';
import { requestReset } from '../../../features/auth/api/passwordReset.js';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { useCountdown } from '../../../hooks/useCountdown.js';

// Long enough to stop the endpoint being hammered, short enough that someone
// waiting on a slow inbox does not give up.
const RESEND_COOLDOWN_SECONDS = 60;

export function useResetLinkRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { showToast } = useToast();
  const { secondsLeft, start } = useCountdown();

  async function sendLink(email, { isResend }) {
    setIsSubmitting(true);
    try {
      await requestReset(email);
      setIsSent(true);
      start(RESEND_COOLDOWN_SECONDS);
      if (isResend) showToast({ type: 'success', title: 'Link sent again', message: 'Any earlier link has stopped working.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Could not send the link', message: err.message || 'Please try again in a moment.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { sendLink, isSubmitting, isSent, secondsLeft };
}
