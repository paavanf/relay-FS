// RequirementRows - the repeatable "N × qualification" rows inside the
// coverage dialog. Add and remove rows; at least one must remain.
import { Plus, X } from 'lucide-react';
import { Select } from '../../../components/ui/Select.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function RequirementRows({ rows, setRows, qualifications }) {
  function update(index, field, value) {
    setRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows([...rows, { qualificationId: qualifications[0]._id, count: 1 }]);
  }

  function removeRow(index) {
    setRows(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-muted">People needed</p>

      {rows.map((row, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="w-20 shrink-0">
            <Input
              type="number"
              min="1"
              max="50"
              value={row.count}
              onChange={(e) => update(index, 'count', e.target.value)}
              aria-label="Count"
              required
            />
          </div>

          <div className="flex-1">
            <Select
              value={row.qualificationId}
              onChange={(e) => update(index, 'qualificationId', e.target.value)}
              aria-label="Qualification"
            >
              {qualifications.map((qualification) => (
                <option key={qualification._id} value={qualification._id}>
                  {qualification.name} ({qualification.code})
                </option>
              ))}
            </Select>
          </div>

          <button
            type="button"
            onClick={() => removeRow(index)}
            disabled={rows.length === 1}
            className="mb-0.5 rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Remove this requirement"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus className="size-4" />
        Add another qualification
      </Button>
    </div>
  );
}
