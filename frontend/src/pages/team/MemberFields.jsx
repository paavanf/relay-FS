// MemberFields - the fields of the edit-member form. The role appears only
// for owners, because only an owner may change one.
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { QualificationPicker } from './QualificationPicker.jsx';
import { MAX_WEEKLY_HOURS } from './memberChanges.js';

export function MemberFields({ values, onChange, qualifications, showRole, hoursError }) {
  const set = (field) => (event) => onChange({ ...values, [field]: event.target.value });

  return (
    <div className="space-y-4 px-5 py-4">
      {showRole && (
        <div>
          <Select label="Role" value={values.role} onChange={set('role')}>
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </Select>
          <p className="mt-1.5 text-xs text-content-tertiary">
            Owners can change roles. The organisation always keeps at least one owner.
          </p>
        </div>
      )}

      <QualificationPicker
        qualifications={qualifications}
        selected={values.qualificationIds}
        onChange={(qualificationIds) => onChange({ ...values, qualificationIds })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Employment" value={values.employmentType} onChange={set('employmentType')}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="casual">Casual</option>
        </Select>

        <Input
          label="Contracted hours a week"
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_WEEKLY_HOURS}
          step="any"
          value={values.hours}
          onChange={set('hours')}
          error={hoursError}
          hint="Fairness is measured against these."
        />
      </div>
    </div>
  );
}
