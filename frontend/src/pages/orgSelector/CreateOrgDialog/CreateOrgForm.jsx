// CreateOrgForm.jsx
// The fields inside the create-organisation dialog. Purely presentational:
// the parent owns the state and does the actual submitting.

import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { TimezoneSelect } from './TimezoneSelect.jsx';

export function CreateOrgForm({
  name,
  setName,
  timezone,
  setTimezone,
  loading,
  error,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <Input
        label="Organisation name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="St. Mary's Hospital"
        minLength={2}
        maxLength={80}
        disabled={loading}
        autoFocus
        required
      />

      <TimezoneSelect value={timezone} onChange={setTimezone} disabled={loading} />

      {error && (
        <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>

        <Button type="submit" isLoading={loading}>
          Create organisation
        </Button>
      </div>
    </form>
  );
}
