// ShiftTemplateFields - the inputs inside ShiftTemplateDialog.
// Split out so the dialog stays about submitting rather than layout.
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';

export function ShiftTemplateFields({ form, setForm }) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="space-y-4 px-5 py-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="Night"
        minLength={2}
        maxLength={40}
        autoFocus
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start"
          type="time"
          value={form.startLocal}
          onChange={(e) => update('startLocal', e.target.value)}
          required
        />
        <Input
          label="End"
          type="time"
          value={form.endLocal}
          onChange={(e) => update('endLocal', e.target.value)}
          required
        />
      </div>

      <p className="-mt-1 text-xs text-content-tertiary">
        If the end time is earlier than the start, the shift is treated as crossing midnight.
      </p>

      <Select
        label="Category"
        value={form.category}
        onChange={(e) => update('category', e.target.value)}
      >
        <option value="day">Day</option>
        <option value="evening">Evening</option>
        <option value="night">Night</option>
      </Select>

      <Input
        label="Burden weight"
        type="number"
        step="0.1"
        min="0.1"
        max="5"
        value={form.burdenWeight}
        onChange={(e) => update('burdenWeight', e.target.value)}
        hint="How heavily this shift counts toward someone's fair share. 1.0 is average."
        required
      />
    </div>
  );
}
