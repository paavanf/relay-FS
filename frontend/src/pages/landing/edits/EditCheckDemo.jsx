// EditCheckDemo - a manager tries to move a shift, and is told whether it is
// legal before saving.
//
// Built from the same pieces as the real assign dialog: ShiftChoices to pick
// a shift and ValidationNotice for the verdict. The verdicts are not written
// by hand - the fixture script asked canAssign() for each choice against the
// generated cafe roster. The day shift starts with "blocked" showing, so the
// point lands even before anyone clicks.
import { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { ShiftChoices } from '../../schedule/assign/ShiftChoices.jsx';
import { ValidationNotice } from '../../schedule/assign/ValidationNotice.jsx';
import { ShiftCard } from '../../myShifts/ShiftCard.jsx';
import { formatLongDate } from '../../schedule/format.js';
import { cafe } from '../fixtures/index.js';

const example = cafe.editExample;
const person = cafe.members.find((m) => m.id === example.membershipId);
const templateOf = (id) => cafe.templates.find((t) => t.id === id);
const withArticle = (word) => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;

export function EditCheckDemo() {
  const [chosenId, setChosenId] = useState(example.choices[0].templateId);
  const verdict = example.choices.find((c) => c.templateId === chosenId)?.verdict;
  const previous = templateOf(example.previous.shiftTemplateId);

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <p className="text-body-sm text-content-secondary">
          {person.name} finished {withArticle(previous.name.toLowerCase())} shift at {previous.endLocal} on{' '}
          {formatLongDate(example.previous.date)}:
        </p>
        <ul>
          <ShiftCard assignment={example.previous} template={previous} timezone={cafe.timezone} />
        </ul>

        <p className="text-sm font-medium text-content-primary">
          Give {person.name} a shift on {formatLongDate(example.date)}?
        </p>
        <ShiftChoices templates={cafe.templates} chosenId={chosenId} onChoose={setChosenId} />

        <div aria-live="polite">
          <ValidationNotice isChecking={false} result={verdict} />
        </div>

        <p className="text-xs text-content-tertiary">
          Both answers were produced by Relay&apos;s rule engine when this page was built. Nothing
          here calls a server.
        </p>
      </CardContent>
    </Card>
  );
}
