// ReturnChoices - "What would you take in return?", for offering a shift and
// for changing an offer later.
//
// Starts at "Any shift I'm free for". Choosing "Only some shifts" opens two
// groups of checkboxes, shift types and days; a group left empty means any.
// Narrowing it is honest about what someone would really do - and it is
// exactly the case where Relay's longer chains find what a direct swap can't.
import { useState } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox.jsx';
import { SHIFT_TYPES, WEEKDAYS } from '../describeFilters.js';

const ANY = { categories: [], daysOfWeek: [] };
const toggled = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function ChoiceGroup({ legend, options, chosen, onToggle }) {
  return (
    <fieldset>
      <legend className="mb-1 text-label text-content-secondary">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((o) => (
          <Checkbox key={o.value} label={o.label} checked={chosen.includes(o.value)} onChange={() => onToggle(o.value)} />
        ))}
      </div>
    </fieldset>
  );
}

export function ReturnChoices({ value, onChange }) {
  const [onlySome, setOnlySome] = useState(value.categories.length + value.daysOfWeek.length > 0);
  const chooseAny = () => {
    setOnlySome(false);
    onChange(ANY);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-label text-content-secondary">What would you take in return?</legend>
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm text-content-primary">
          <input type="radio" name="return" className="size-4" checked={!onlySome} onChange={chooseAny} />
          Any shift I&apos;m free for
        </label>
        <label className="flex items-center gap-2 text-sm text-content-primary">
          <input type="radio" name="return" className="size-4" checked={onlySome} onChange={() => setOnlySome(true)} />
          Only some shifts
        </label>
      </div>

      {onlySome && (
        <div className="space-y-3 rounded-md border border-line-subtle p-3">
          <ChoiceGroup legend="Shift types" options={SHIFT_TYPES} chosen={value.categories} onToggle={(v) => onChange({ ...value, categories: toggled(value.categories, v) })} />
          <ChoiceGroup legend="Days" options={WEEKDAYS} chosen={value.daysOfWeek} onToggle={(v) => onChange({ ...value, daysOfWeek: toggled(value.daysOfWeek, v) })} />
          <p className="text-xs text-content-tertiary">Leave a group empty to accept any.</p>
        </div>
      )}
    </fieldset>
  );
}
