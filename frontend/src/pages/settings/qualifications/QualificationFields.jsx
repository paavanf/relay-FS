// QualificationFields - the three inputs of QualificationDialog: name, the
// short code the roster grid shows, and an optional description.
import { Input } from '../../../components/ui/Input.jsx';

export function QualificationFields({ values, onChange }) {
  const set = (field) => (event) => onChange({ ...values, [field]: event.target.value });

  return (
    <div className="space-y-4 px-5 py-4">
      <Input
        label="Name"
        value={values.name}
        onChange={set('name')}
        placeholder="Registered Nurse"
        minLength={2}
        maxLength={60}
        autoFocus
        required
      />
      <Input
        label="Code"
        value={values.code}
        onChange={set('code')}
        placeholder="RN"
        maxLength={20}
        hint="Stored in capitals, and unique within this organisation."
        required
      />
      <Input label="Description" value={values.description} onChange={set('description')} placeholder="Optional" maxLength={200} />
    </div>
  );
}
