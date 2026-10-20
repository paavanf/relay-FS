// CoverageDialog - sets the coverage for one shift on one weekday.
//
// Submits with PUT, which upserts on (shiftTemplateId, dayOfWeek): choosing a
// pair that already has a rule replaces it rather than creating a duplicate.
// The fields are in CoverageRuleFields.jsx and the save in useCoverageSave.js.
import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../../components/ui/dialog/index.js';
import { Button } from '../../../components/ui/Button.jsx';
import { CoverageRuleFields } from './CoverageRuleFields.jsx';
import { useCoverageSave } from './useCoverageSave.js';

export function CoverageDialog({ templates, qualifications, onClose }) {
  const [rule, setRule] = useState({
    shiftTemplateId: templates[0]._id,
    dayOfWeek: '0',
    rows: [{ qualificationId: qualifications[0]._id, count: 1 }],
  });
  const setRows = (rows) => setRule((current) => ({ ...current, rows }));
  const mutation = useCoverageSave(onClose);

  function handleSubmit(event) {
    event.preventDefault();

    // The selects hand back strings; the API expects numbers.
    mutation.mutate({
      shiftTemplateId: rule.shiftTemplateId,
      dayOfWeek: Number(rule.dayOfWeek),
      requirements: rule.rows.map((row) => ({ qualificationId: row.qualificationId, count: Number(row.count) })),
    });
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>Add coverage rule</DialogTitle>
          <DialogDescription>Setting a shift and day that already has a rule replaces it.</DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <CoverageRuleFields templates={templates} qualifications={qualifications} rule={rule} onChange={setRule} setRows={setRows} />

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
