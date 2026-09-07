// ForgotPasswordForm - asks for an email and requests a reset link.
//
// The confirmation is identical whether or not the address is registered.
// Saying "no such account" would let anyone check which emails have accounts.
//
// The email stays in state after sending so the resend button can re-use it
// without asking for it again.

import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ResetLinkSent } from './ResetLinkSent.jsx';
import { requestReset } from '../../../features/auth/api/passwordReset.js';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { useCountdown } from '../../../hooks/useCountdown.js';

// Long enough to stop the endpoint being hammered, short enough that someone
// waiting on a slow inbox does not give up.
const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { showToast } = useToast();
  const { secondsLeft, start } = useCountdown();

  // Shared by the first send and every resend: the request, the cooldown, and
  // the error handling are identical.
  async function sendLink({ isResend }) {
    setIsSubmitting(true);

    try {
      await requestReset(email);
      setIsSent(true);
      start(RESEND_COOLDOWN_SECONDS);

      if (isResend) {
        showToast({
          type: 'success',
          title: 'Link sent again',
          message: 'Any earlier link has stopped working.',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not send the link',
        message: err.message || 'Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendLink({ isResend: false });
  }

  if (isSent) {
    return (
      <ResetLinkSent
        email={email}
        secondsLeft={secondsLeft}
        isSending={isSubmitting}
        onResend={() => sendLink({ isResend: true })}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
