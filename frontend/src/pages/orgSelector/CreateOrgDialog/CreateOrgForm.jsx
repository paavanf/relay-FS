// CreateOrgForm - the fields inside the create-organisation dialog.
// Presentational: the parent owns the state and does the submitting.

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
    <form onSubmit={onSubmit}>
      <div className="space-y-4 px-5 py-4">
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
          <p className="rounded-lg border border-danger/25 bg-danger-tint px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
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
