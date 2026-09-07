// ForgotPasswordForm - asks for an email and requests a reset link.
//
// The confirmation is identical whether or not the address is registered.
// Saying "no such account" would let anyone check which emails have accounts.

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { requestReset } from '../../../features/auth/api/passwordReset.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { showToast } = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await requestReset(email);
      setIsSent(true);
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

  if (isSent) {
    return (
      <div className="rounded-xl border border-line bg-surface-raised p-5">
        <MailCheck className="size-5 text-success" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-ink">Check your inbox</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
          If that email is registered, we have sent a reset link. It expires in an hour.
        </p>
      </div>
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
