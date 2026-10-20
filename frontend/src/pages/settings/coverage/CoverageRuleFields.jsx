// CoverageRuleFields - what CoverageDialog asks: which shift, which weekday,
// and how many people with which qualification (RequirementRows.jsx).
import { Select } from '../../../components/ui/Select.jsx';
import { RequirementRows } from './RequirementRows.jsx';
import { DAY_NAMES } from './days.js';

export function CoverageRuleFields({ templates, qualifications, rule, onChange, setRows }) {
  return (
    <div className="space-y-4 px-5 py-4">
      <Select label="Shift template" value={rule.shiftTemplateId} onChange={(e) => onChange({ ...rule, shiftTemplateId: e.target.value })}>
        {templates.map((template) => (
          <option key={template._id} value={template._id}>
            {template.name} ({template.startLocal}–{template.endLocal})
          </option>
        ))}
      </Select>

      <Select label="Day of week" value={rule.dayOfWeek} onChange={(e) => onChange({ ...rule, dayOfWeek: e.target.value })}>
        {DAY_NAMES.map((name, index) => (
          <option key={name} value={String(index)}>
            {name}
          </option>
        ))}
      </Select>

      <RequirementRows rows={rule.rows} setRows={setRows} qualifications={qualifications} />
    </div>
  );
}
