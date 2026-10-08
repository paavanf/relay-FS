// InviteMemberForm - the invite dialog's form: the address to invite, the
// role they join with, and the qualifications they hold.
import { useState } from 'react';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { QualificationPicker } from './QualificationPicker.jsx';

export function InviteMemberForm({ qualifications, isSending, onSubmit, onCancel }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [qualificationIds, setQualificationIds] = useState([]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email, role, qualificationIds });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 px-5 py-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nurse@example.com"
          autoFocus
          required
        />

        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
        </Select>

        <QualificationPicker
          qualifications={qualifications}
          selected={qualificationIds}
          onChange={setQualificationIds}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSending}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSending}>
          Create invite
        </Button>
      </div>
    </form>
  );
}
