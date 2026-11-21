// SigningInWithGoogle - section 6 of the privacy page. "Continue with Google" asks
// Supabase for a plain Google sign-in with no extra scopes
// (supabaseAuthClient.js), so Google is asked only for the basic ones -
// openid, email and profile (docs/deploy/SUPABASE.md). The backend takes
// the name and email from the token (services/identity/claims.js); no
// avatar is ever shown (components/ui/Avatar.jsx is never given a photo).
import { PolicySection } from '../PolicySection.jsx';

export function SigningInWithGoogle() {
  return (
    <PolicySection id="google-sign-in" title="6. Signing in with Google">
      <p>
        If you choose Continue with Google, Relay asks Google only for your email address and your basic profile: your
        name and profile picture. Google sends them to Supabase, which keeps them with your sign-in.
      </p>
      <p>
        Relay&apos;s database keeps your name and email address from them. Relay uses them to sign you in, to match you
        with invites sent to that address, and to show your name to your team. It does not use your profile picture,
        and it gets no other access to your Google account.
      </p>
    </PolicySection>
  );
}
