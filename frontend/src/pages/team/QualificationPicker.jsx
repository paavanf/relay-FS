// QualificationPicker - pick which qualifications the invitee holds.
// Checkboxes rather than a multi-select: the list is short and every option
// should be visible without opening anything.
import { Checkbox } from '../../components/ui/Checkbox.jsx';

export function QualificationPicker({ qualifications, selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (qualifications.length === 0) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-muted">Qualifications</p>
        <p className="text-[13px] text-ink-subtle">
          None set up yet. You can add them in Settings and assign them later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-muted">Qualifications</p>

      <div className="space-y-2 rounded-lg border border-line p-3">
        {qualifications.map((qualification) => (
          <Checkbox
            key={qualification._id}
            label={`${qualification.name} (${qualification.code})`}
            checked={selected.includes(qualification._id)}
            onChange={() => toggle(qualification._id)}
          />
        ))}
      </div>
    </div>
  );
}
