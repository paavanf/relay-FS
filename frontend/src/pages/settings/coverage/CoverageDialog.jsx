// CoverageDialog - sets the coverage for one shift on one weekday.
//
// Submits with PUT, which upserts on (shiftTemplateId, dayOfWeek): choosing a
// pair that already has a rule replaces it rather than creating a duplicate.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog/index.js';
import { Select } from '../../../components/ui/Select.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { RequirementRows } from './RequirementRows.jsx';
import { DAY_NAMES } from './days.js';
import { upsertCoverage } from '../../../features/catalog/api/coverage.js';
import { useOrg } from '../../../features/organisation/useOrg.js';
import { useToast } from '../../../components/ui/toast/useToast.js';

export function CoverageDialog({ templates, qualifications, onClose }) {
  const [shiftTemplateId, setShiftTemplateId] = useState(templates[0]._id);
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [rows, setRows] = useState([{ qualificationId: qualifications[0]._id, count: 1 }]);

  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => upsertCoverage(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage', orgId] });
      showToast({ type: 'success', title: 'Coverage saved' });
      onClose();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  function handleSubmit(event) {
    event.preventDefault();

    // The selects hand back strings; the API expects numbers.
    mutation.mutate({
      shiftTemplateId,
      dayOfWeek: Number(dayOfWeek),
      requirements: rows.map((row) => ({
        qualificationId: row.qualificationId,
        count: Number(row.count),
      })),
    });
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>Add coverage rule</DialogTitle>
          <DialogDescription>
            Setting a shift and day that already has a rule replaces it.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-4">
            <Select
              label="Shift template"
              value={shiftTemplateId}
              onChange={(e) => setShiftTemplateId(e.target.value)}
            >
              {templates.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.startLocal}–{template.endLocal})
                </option>
              ))}
            </Select>

            <Select
              label="Day of week"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
            >
              {DAY_NAMES.map((name, index) => (
                <option key={name} value={String(index)}>
                  {name}
                </option>
              ))}
            </Select>

            <RequirementRows rows={rows} setRows={setRows} qualifications={qualifications} />
          </div>

          <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Save coverage
            </Button>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
