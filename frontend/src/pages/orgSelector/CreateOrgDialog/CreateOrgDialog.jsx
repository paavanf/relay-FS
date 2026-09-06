// CreateOrgDialog.jsx
// Dialog for creating a new organisation. Owns the submit logic; the fields
// themselves live in CreateOrgForm.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog/index.js';
import { CreateOrgForm } from './CreateOrgForm.jsx';
import { createOrg } from '../../../features/organisation/api/createOrg.js';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

function CreateOrgDialog({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addMembership } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createOrg({ name, timezone });

      // Put the new org into context before navigating: OrgProvider looks the
      // orgId up in memberships and would bounce us to /403 if it isn't there.
      addMembership({
        orgId: result.id,
        orgName: result.name,
        role: 'owner',
        qualificationIds: [],
      });

      showToast({
        type: 'success',
        title: 'Organisation created',
        message: `Welcome to ${result.name}`,
      });

      setName('');
      onClose();
      navigate(`/app/${result.id}/schedule`);
    } catch (err) {
      const message = err.message || 'Could not create the organisation';
      setError(message);
      showToast({ type: 'error', title: 'Could not create organisation', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogPanel>
        <DialogTitle>Create an organisation</DialogTitle>
        <DialogDescription>
          You will be its owner, and can invite the rest of your team afterwards.
        </DialogDescription>

        <CreateOrgForm
          name={name}
          setName={setName}
          timezone={timezone}
          setTimezone={setTimezone}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogPanel>
    </Dialog>
  );
}

export default CreateOrgDialog;
