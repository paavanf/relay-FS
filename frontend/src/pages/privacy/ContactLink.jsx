// ContactLink - the address to write to about your data (policyFacts.js).
// Underlined as well as coloured, so it stands out from the sentence around
// it without relying on colour alone.
import { CONTACT_EMAIL } from './policyFacts.js';

export function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium break-all text-brand-solid underline underline-offset-2 hover:text-brand-content"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
