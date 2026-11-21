// WhoRunsRelay - section 1 of the privacy page: whose project this is, and
// where to write about your data.
import { PolicySection } from '../PolicySection.jsx';
import { ContactLink } from '../ContactLink.jsx';

export function WhoRunsRelay() {
  return (
    <PolicySection id="who-runs-relay" title="1. Who runs Relay">
      <p>Relay is a personal portfolio project by Paavan Fatepuria, not a company.</p>
      <p>
        For anything about your data, or to have it deleted, email <ContactLink />.
      </p>
    </PolicySection>
  );
}
