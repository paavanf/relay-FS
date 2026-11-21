// WhatRelayDoesNotDo - section 5 of the privacy page. The emails: Supabase
// sends the sign-up confirmation and the password reset; Relay's own server
// can email invites and notices (backend/src/services/email), but this
// deployment turns that off (EMAIL_ENABLED=false in render.yaml, because
// Render blocks outgoing SMTP).
import { PolicySection } from '../PolicySection.jsx';

export function WhatRelayDoesNotDo() {
  return (
    <PolicySection id="what-relay-does-not-do" title="5. What Relay does not do">
      <ul>
        <li>
          Relay does not sell your data, show adverts, or share your data with anyone outside your team, apart from
          the services in section 3 that store it and run Relay.
        </li>
        <li>Relay sends no marketing email.</li>
      </ul>
      <p>
        The only emails you get come from Supabase: one to confirm your address when you sign up with an email and
        password, and one to reset your password when you ask for it.
      </p>
      <p>
        Relay&apos;s own server sends no email on this website: invites are shared as links, and notifications stay in
        the app. Relay can email invites and swap and roster notices when it is set up with an email service, but this
        website is not.
      </p>
    </PolicySection>
  );
}
