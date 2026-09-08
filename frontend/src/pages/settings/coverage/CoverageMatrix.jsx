// CoverageMatrix - the coverage rules, grouped by shift template.
// Reading down one shift shows its week at a glance.
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { DeleteCoverageButton } from './DeleteCoverageButton.jsx';
import { dayName } from './days.js';

export function CoverageMatrix({ coverage, templates, qualifications }) {
  // Lookups so a rule can name its shift and qualifications.
  const templateById = Object.fromEntries(templates.map((t) => [t._id, t]));
  const qualById = Object.fromEntries(qualifications.map((q) => [q._id, q]));

  // Only show templates that actually have rules.
  const withRules = templates.filter((t) => coverage.some((c) => c.shiftTemplateId === t._id));

  return (
    <div className="space-y-4">
      {withRules.map((template) => {
        const rules = coverage
          .filter((c) => c.shiftTemplateId === template._id)
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        return (
          <Card key={template._id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <p className="data text-body-sm text-content-secondary">
                {template.startLocal}–{template.endLocal}
              </p>
            </CardHeader>

            <ul className="divide-y divide-line-subtle">
              {rules.map((rule) => (
                <li key={rule._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-content-primary">{dayName(rule.dayOfWeek)}</p>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {rule.requirements.map((requirement) => (
                        <Badge key={requirement.qualificationId} variant="neutral">
                          <span className="data">{requirement.count}×</span>{' '}
                          {qualById[requirement.qualificationId]?.code ?? 'Removed'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <DeleteCoverageButton coverage={rule} dayLabel={dayName(rule.dayOfWeek)} />
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {/* A rule can outlive the template it points at if that was retired. */}
      {coverage.some((c) => !templateById[c.shiftTemplateId]) && (
        <p className="text-body-sm text-content-tertiary">
          Some rules refer to a retired shift template and are no longer applied.
        </p>
      )}
    </div>
  );
}
