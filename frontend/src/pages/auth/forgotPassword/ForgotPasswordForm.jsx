// ForgotPasswordForm - asks for an email and requests a reset link
// (useResetLinkRequest.js does the asking).
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
import { useResetLinkRequest } from './useResetLinkRequest.js';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { sendLink, isSubmitting, isSent, secondsLeft } = useResetLinkRequest();

  function handleSubmit(event) {
    event.preventDefault();
    sendLink(email, { isResend: false });
  }

  if (isSent) {
    return (
      <ResetLinkSent
        email={email}
        secondsLeft={secondsLeft}
        isSending={isSubmitting}
        onResend={() => sendLink(email, { isResend: true })}
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
