// MemberActions - the last cell of a member's row: edit them and, where this
// viewer may, deactivate them. Both are locked in the shared demo
// organisation (features/demo/DemoLock.jsx).
import { Pencil, UserMinus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { DemoLock } from '../../features/demo/DemoLock.jsx';

export function MemberActions({ member, canDeactivate, onEdit, onDeactivate }) {
  return (
    <div className="flex justify-end gap-1">
      <DemoLock>
        <Button variant="ghost" size="sm" onClick={() => onEdit(member)} aria-label={`Edit ${member.name}`}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit
        </Button>
      </DemoLock>
      {canDeactivate && (
        <DemoLock>
          <Button variant="ghost" size="sm" onClick={() => onDeactivate(member)} aria-label={`Deactivate ${member.name}`} title="Deactivate">
            <UserMinus className="size-4" aria-hidden="true" />
          </Button>
        </DemoLock>
      )}
    </div>
  );
}
