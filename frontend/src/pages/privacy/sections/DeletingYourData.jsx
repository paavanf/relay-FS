// DeletingYourData - section 8 of the privacy page. Relay has no way to
// delete an account from inside the app, so a request is handled by hand:
// the Supabase user is deleted in its dashboard, and the Relay account's
// name and email address are removed from the database. Deleting the
// Supabase user on its own keeps the Relay account
// (backend/src/services/identity/deleteIdentity.service.js), which is why
// the second step is promised separately.
import { PolicySection } from '../PolicySection.jsx';
import { ContactLink } from '../ContactLink.jsx';

export function DeletingYourData() {
  return (
    <PolicySection id="deleting-your-data" title="8. Deleting your data">
      <p>
        Relay has no delete button yet. To have your data deleted, email me at <ContactLink /> from the address you
        sign in with. I will delete your sign-in at Supabase, and remove your name and email address from Relay&apos;s
        database.
      </p>
      <p>
        Rosters and swaps you were part of stay in your team&apos;s records, because they are your team&apos;s history
        too, but without your name on them.
      </p>
    </PolicySection>
  );
}
