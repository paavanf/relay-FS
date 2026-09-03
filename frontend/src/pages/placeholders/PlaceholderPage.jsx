// PlaceholderPage - the shared "this feature isn't built yet" screen.
//
// Every feature page waiting on a later milestone renders this with its own
// title and capability list, so an unfinished page still looks deliberate.
// The capability list uses an overlapping offset panel for spatial depth.

import { Construction, Check } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function PlaceholderPage({ title, description, milestone, capabilities = [] }) {
  useDocumentTitle(title);

  return (
    <div className="mx-auto max-w-4xl px-2 pt-8 pb-16">
      <Reveal delay={0}>
        <PageHeader title={title} description={description} />
      </Reveal>

      <Reveal delay={140} className="mt-10">
        <Card tilt>
          <CardContent className="pt-8">
            <div className="flex items-center gap-2.5">
              <Construction className="size-4 text-amber-300" aria-hidden="true" />
              <Badge variant="amber">Coming in Milestone {milestone}</Badge>
            </div>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              This screen is a placeholder. The layout, routing, and permissions around it already
              work — only the feature itself is still to come.
            </p>
          </CardContent>
        </Card>
      </Reveal>

      {capabilities.length > 0 && (
        // Pulled up and inset so it overlaps the card above it.
        <div className="relative z-10 -mt-6 px-4 sm:px-10">
          <Reveal delay={260}>
            <div className="glass-strong glass-edge rounded-2xl p-7">
              <h2 className="text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
                What it will do
              </h2>

              <ul className="mt-5 space-y-3.5">
                {capabilities.map((capability, index) => (
                  <Reveal
                    as="li"
                    key={capability}
                    delay={340 + index * 80}
                    className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft"
                  >
                    <span className="mt-0.5 rounded-md border border-indigo-400/25 bg-indigo-500/15 p-1">
                      <Check className="size-3 text-indigo-200" aria-hidden="true" />
                    </span>
                    {capability}
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}

export default PlaceholderPage;
