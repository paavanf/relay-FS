// LandingSection - the frame every section of the landing page shares.
//
// One heading, one short introduction, then the demonstration. Sections are
// separated by a hairline rather than boxed in cards: the product UI inside
// them already has its own surfaces, and a card around a card is noise.
export function LandingSection({ id, title, intro, children }) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-line-subtle py-16 sm:py-20">
      <div className="max-w-2xl">
        <h2 id={headingId} className="text-h1 tracking-[-0.01em] text-content-primary">
          {title}
        </h2>
        {intro && <p className="mt-3 text-base leading-relaxed text-content-secondary">{intro}</p>}
      </div>

      <div className="mt-10">{children}</div>
    </section>
  );
}
