// AvailabilityEditor - the weekly declaration itself, plus what it means.
//
// Split out of the page so the page is only layout: load, place the context
// card, place the editor.
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { RecurringAvailability } from './RecurringAvailability.jsx';
import { AvailabilityLegend } from './AvailabilityLegend.jsx';
import { SaveAvailabilityBar } from './SaveAvailabilityBar.jsx';

export function AvailabilityEditor({ statusByDay, isDirty, onChange, onSaved }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Every week</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringAvailability statusByDay={statusByDay} onChange={onChange} />
        </CardContent>
      </Card>

      <SaveAvailabilityBar statusByDay={statusByDay} isDirty={isDirty} onSaved={onSaved} />

      <Card>
        <CardHeader>
          <CardTitle>What these mean</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityLegend />
        </CardContent>
      </Card>
    </div>
  );
}
