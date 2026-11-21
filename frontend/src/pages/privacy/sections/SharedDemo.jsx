// SharedDemo - section 7 of the privacy page. The nightly workflow
// (.github/workflows/nightly.yml) runs the demo seed, which deletes the demo
// organisation and everything in it - real accounts' memberships of it too -
// and puts the demo accounts' names and the public password back
// (backend/scripts/demo/reset.js, demoAccounts.js). Nothing outside the demo
// ward is touched.
import { PolicySection } from '../PolicySection.jsx';

export function SharedDemo() {
  return (
    <PolicySection id="shared-demo" title="7. The shared demo">
      <p>
        The demo ward and its accounts are shared by everyone who tries the demo, and their password is public. Every
        night the ward and its accounts are put back the way they started: anything added to the ward is deleted,
        including any account&apos;s membership of it. Until then, anyone using the demo can see it.
      </p>
      <p>
        So please do not put real personal information into the demo. Your own account, and any team you create
        outside the demo, are not touched by the nightly reset.
      </p>
    </PolicySection>
  );
}
