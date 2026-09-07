// PlaceholderPage - the shared screen for features still being built.
//
// It sits inside the real app shell and states plainly what the feature will
// do, so an unfinished area reads as a product rolling out rather than a
// broken page.

import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function PlaceholderPage({ title, description, capabilities = [] }) {
  useDocumentTitle(title);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} description={description} />

      <Card className="mt-6">
        <CardContent className="py-6">
          <Badge variant="warning">In development</Badge>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
            The layout, routing and permissions around this page already work. The feature itself
            is still being built.
          </p>

          {capabilities.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h2 className="text-[13px] font-medium text-ink">What it will do</h2>

              <ul className="mt-3 space-y-2">
                {capabilities.map((capability) => (
                  <li key={capability} className="flex gap-2.5 text-[13px] text-ink-muted">
                    <span
                      className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-subtle"
                      aria-hidden="true"
                    />
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PlaceholderPage;
