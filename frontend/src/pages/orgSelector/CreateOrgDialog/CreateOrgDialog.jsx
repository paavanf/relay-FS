// CreateOrgDialog - creates an organisation. Owns the submit logic; the
// fields live in CreateOrgForm.

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

      // Into context before navigating: OrgProvider resolves the orgId against
      // memberships and would bounce us to /403 if it were not there yet.
      addMembership({
        orgId: result.id,
        orgName: result.name,
        role: 'owner',
        qualificationIds: [],
      });

      showToast({
        type: 'success',
        title: 'Organisation created',
        message: `You are the owner of ${result.name}.`,
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
        <div className="border-b border-line px-5 py-4">
          <DialogTitle>Create an organisation</DialogTitle>
          <DialogDescription>
            You will be its owner, and can invite the rest of your team afterwards.
          </DialogDescription>
        </div>

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
