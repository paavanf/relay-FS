// WhereItIsStored - section 3 of the privacy page: the services that hold or
// carry Relay's data. Render's region is the one render.yaml sets; the
// Supabase and MongoDB Atlas regions are chosen in their dashboards and are
// not recorded in this repository, so the page does not name them.
import { PolicySection } from '../PolicySection.jsx';

export function WhereItIsStored() {
  return (
    <PolicySection id="where-it-is-stored" title="3. Where it is stored">
      <p>Four services hold or carry Relay&apos;s data:</p>
      <ul>
        <li>
          <strong>Supabase</strong> keeps your sign-in: your email address, your password if you set one, and what
          Google shares if you sign in with Google (section 6).
        </li>
        <li>
          <strong>MongoDB Atlas</strong> holds Relay&apos;s database: your Relay account, and everything you put into
          Relay.
        </li>
        <li>
          <strong>Render</strong> runs Relay&apos;s server, in its Singapore region, and keeps the server&apos;s logs.
        </li>
        <li>
          <strong>Vercel</strong> serves this website, and passes its requests for data on to Relay&apos;s server.
        </li>
      </ul>
    </PolicySection>
  );
}
