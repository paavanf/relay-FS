// TimezoneSelect - common timezones for the create-organisation form.
// The roster is generated and displayed in whichever one is chosen.

import { Select } from '../../../components/ui/Select.jsx';

const timezones = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
];

export function TimezoneSelect({ value, onChange, disabled }) {
  return (
    <Select
      label="Timezone"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {timezones.map((zone) => (
        <option key={zone.value} value={zone.value}>
          {zone.label}
        </option>
      ))}
    </Select>
  );
}
