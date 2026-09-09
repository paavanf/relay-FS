// RosterRulesForm - the three scheduling rules, editable or read-only.
//
// Workers see the same values a manager does, just as plain text. Someone
// being scheduled under these limits should be able to check what they are
// without needing permission to change them.
import { Input } from '../../../components/ui/Input.jsx';
import { RULE_FIELDS } from './rules.js';

export function RosterRulesForm({ values, errors, canEdit, onChange }) {
  if (!canEdit) {
    return (
      <dl className="divide-y divide-line-subtle">
        {RULE_FIELDS.map((field) => (
          <div key={field.name} className="flex items-baseline justify-between gap-4 py-3">
            <div>
              <dt className="text-body-sm font-medium text-content-primary">{field.label}</dt>
              <dd className="mt-0.5 text-xs text-content-secondary">{field.helper}</dd>
            </div>

            <span className="data shrink-0 text-body-sm text-content-primary">
              {values[field.name]}
            </span>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="space-y-5">
      {RULE_FIELDS.map((field) => (
        <Input
          key={field.name}
          type="number"
          label={field.label}
          hint={field.helper}
          error={errors[field.name]}
          min={field.min}
          max={field.max}
          step={1}
          value={Number.isFinite(values[field.name]) ? values[field.name] : ''}
          // An empty box is NaN rather than 0, so clearing a field reads as
          // "not filled in" and not as "no rest required".
          onChange={(e) => onChange(field.name, parseInt(e.target.value, 10))}
        />
      ))}
    </div>
  );
}
