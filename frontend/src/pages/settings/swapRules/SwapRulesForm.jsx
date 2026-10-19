// SwapRulesForm - the three swap rules, for a manager to change: how long
// people have to accept a proposed swap, whether a manager approves every
// swap, and the longest chain of people Relay suggests.
import { Input } from '../../../components/ui/Input.jsx';
import { Checkbox } from '../../../components/ui/Checkbox.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { WINDOW_RANGE, CHAIN_LENGTHS } from './swapRuleFields.js';

export function SwapRulesForm({ values, errors, onChange }) {
  return (
    <div className="space-y-5">
      <Input
        type="number"
        label="Time to accept a proposed swap (hours)"
        hint="Everyone in a swap has this long to accept it - less if one of its shifts starts sooner. Then it ends and nothing changes."
        error={errors.acceptanceWindowHours}
        min={WINDOW_RANGE.min}
        max={WINDOW_RANGE.max}
        step={1}
        value={Number.isFinite(values.acceptanceWindowHours) ? values.acceptanceWindowHours : ''}
        onChange={(e) => onChange('acceptanceWindowHours', parseInt(e.target.value, 10))}
      />

      <div>
        <Checkbox
          label="A manager approves every swap before it happens"
          checked={values.requireManagerApproval === true}
          onChange={(e) => onChange('requireManagerApproval', e.target.checked)}
        />
        <p className="mt-1 text-xs text-content-secondary">
          Off: a swap happens as soon as everyone in it accepts. Either way, Relay checks it against every scheduling rule first.
        </p>
      </div>

      <Select
        label="Longest chain of people"
        error={errors.maxChainLength}
        value={values.maxChainLength ?? ''}
        onChange={(e) => onChange('maxChainLength', parseInt(e.target.value, 10))}
      >
        {CHAIN_LENGTHS.map((length) => (
          <option key={length} value={length}>
            {length === 2 ? '2 people - direct swaps only' : `${length} people`}
          </option>
        ))}
      </Select>
    </div>
  );
}
