// CreateRosterFields - the three inputs behind a new roster.
// Split out so the dialog itself is only the shell around them.
import { Input } from '../../components/ui/Input.jsx';

export function CreateRosterFields({ values, errors, onChange }) {
  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={values.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="March, week 1-2"
        error={errors.name}
        required
      />

      <div className="flex gap-3">
        <Input
          type="date"
          label="First day"
          value={values.startDate}
          onChange={(e) => onChange('startDate', e.target.value)}
          error={errors.startDate}
          required
        />
        <Input
          type="date"
          label="Last day"
          value={values.endDate}
          onChange={(e) => onChange('endDate', e.target.value)}
          error={errors.endDate}
          required
        />
      </div>
    </div>
  );
}
