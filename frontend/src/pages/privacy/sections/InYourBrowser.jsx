// InYourBrowser - section 4 of the privacy page: what the website keeps in
// the browser. The key names and the 7 days are imported from the code that
// uses them, so the page cannot name a key the app no longer writes. Nothing
// else in frontend/src touches localStorage, sessionStorage or cookies, and
// the only outside requests the page makes are for Google Fonts (index.html).
import { SESSION_KEY } from '../../../lib/auth/storedSession.js';
import { SIGNED_IN_AT_KEY } from '../../../lib/auth/sessionAge.js';
import { STORAGE_KEY as THEME_KEY } from '../../../features/theme/themeStorage.js';
import { SESSION_MAX_AGE_DAYS } from '../../../../../shared/sessionLimits.js';
import { PolicySection, Literal } from '../PolicySection.jsx';

export function InYourBrowser() {
  return (
    <PolicySection id="in-your-browser" title="4. In your browser">
      <p>Relay keeps three things in your browser&apos;s local storage:</p>
      <ul>
        <li>
          <Literal>{SESSION_KEY}</Literal>: your sign-in from Supabase. That is the tokens that prove to Relay&apos;s
          server who you are, and your account details from Supabase, such as your email address.
        </li>
        <li>
          <Literal>{SIGNED_IN_AT_KEY}</Literal>: when you signed in. Relay signs you out {SESSION_MAX_AGE_DAYS} days
          after that, however active you have been.
        </li>
        <li>
          <Literal>{THEME_KEY}</Literal>: your theme, whether light, dark or matching your device.
        </li>
      </ul>
      <p>
        Signing out removes the first two. Relay sets no cookies, and has no analytics, advertising or tracking
        scripts.
      </p>
      <p>
        Relay&apos;s fonts come from Google Fonts, so opening Relay makes your browser download them from Google&apos;s
        servers.
      </p>
    </PolicySection>
  );
}
