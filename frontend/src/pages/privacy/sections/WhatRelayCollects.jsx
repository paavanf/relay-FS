// WhatRelayCollects - section 2 of the privacy page. Each line is read from
// the code: the User and Membership models and the rest of
// backend/src/models, who may read what (backend/src/routes and services),
// and the one automatic deletion - the notifications' 90-day TTL index. The
// server's logs are in ServerLogs.jsx.
import { PolicySection, PolicySubheading } from '../PolicySection.jsx';
import { ServerLogs } from './ServerLogs.jsx';

export function WhatRelayCollects() {
  return (
    <PolicySection id="what-relay-collects" title="2. What Relay collects">
      <PolicySubheading>When you sign in</PolicySubheading>
      <p>
        Signing in is handled by Supabase (section 3). If you sign in with a password, it goes from your browser
        straight to Supabase: Relay&apos;s server never sees it, and Relay&apos;s database does not store it.
      </p>
      <p>
        Relay&apos;s own database keeps your name, your email address, the ID of your Supabase account, and when your
        Relay account was created and last changed.
      </p>

      <PolicySubheading>What you put into Relay</PolicySubheading>
      <ul>
        <li>
          The organisations you create or join, and in each one your role, qualifications, employment type, contracted
          hours, and whether you want swap and roster emails.
        </li>
        <li>The availability you declare, with any notes.</li>
        <li>Rosters, and the shifts on them.</li>
        <li>Swap offers and proposals, with any notes, and a record of each step of every swap: who did what, and when.</li>
        <li>Invites, each with the email address it was sent to.</li>
        <li>Fairness figures, worked out from published rosters.</li>
        <li>Your notifications.</li>
      </ul>

      <PolicySubheading>Who can see it</PolicySubheading>
      <p>
        Everyone in a team can see its members&apos; names, email addresses, roles, qualifications, employment types and
        contracted hours, and its published rosters. The people in a swap see each other&apos;s names and the shifts
        being swapped. Managers and owners also see draft rosters, and everyone&apos;s availability and fairness figures.
        Relay shows nothing in a team to anyone outside it.
      </p>

      <PolicySubheading>How long it is kept</PolicySubheading>
      <p>
        Notifications are deleted 90 days after they are written. Nothing else is deleted automatically, except in the
        shared demo (section 7). To have your data deleted, see section 8.
      </p>

      <ServerLogs />
    </PolicySection>
  );
}
