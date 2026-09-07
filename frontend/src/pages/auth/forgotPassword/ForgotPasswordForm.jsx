// ForgotPasswordForm.jsx
// Asks for an email and requests a reset link.
//
// The confirmation is deliberately the same whether or not the address is
// registered - saying "no such account" would let anyone check which emails
// have accounts here.

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
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit rounded-2xl border border-white/14 bg-white/7 p-3.5">
          <MailCheck className="size-6 text-emerald-300" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">
          If that email is registered, we&apos;ve sent a reset link. Check your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
