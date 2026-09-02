// PlaceholderPage - the shared "this feature isn't built yet" screen.
//
// Every feature page that is waiting on a later milestone renders this with
// its own title, description, and list of what it will eventually do. That
// way an unfinished page still looks deliberate rather than broken.

import { Construction, Check } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function PlaceholderPage({ title, description, milestone, capabilities = [] }) {
  useDocumentTitle(title);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={title} description={description} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Construction className="size-4 text-amber-600" aria-hidden="true" />
            <Badge variant="amber">Coming in Milestone {milestone}</Badge>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            This screen is a placeholder. The layout, routing, and permissions around it already
            work - only the feature itself is still to come.
          </p>

          {capabilities.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-semibold text-slate-900">What it will do</h2>
              <ul className="mt-3 space-y-2">
                {capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    {capability}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PlaceholderPage;
