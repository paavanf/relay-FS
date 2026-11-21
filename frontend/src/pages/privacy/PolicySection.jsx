// PolicySection - one numbered part of the privacy page: its heading, then
// plain paragraphs and lists. The text style is set here once - size,
// colour, list bullets, bold lead-ins - so each section's file holds only
// its words. Also the two small pieces the sections share: a sub-heading,
// and a literal name such as a storage key.

export function PolicySection({ id, title, children }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-h2 text-content-primary">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-content-secondary [&_strong]:font-semibold [&_strong]:text-content-primary [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function PolicySubheading({ children }) {
  return <h3 className="pt-2 text-h3 text-content-primary">{children}</h3>;
}

export function Literal({ children }) {
  return <code className="font-mono text-body-sm break-all text-content-primary">{children}</code>;
}
