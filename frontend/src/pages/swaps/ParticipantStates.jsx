// ParticipantStates - where everyone in a proposed swap stands, as a list:
// "Asha Patel - Accepted". The diagram shows the same thing as one picture,
// so this is what a screen reader reads, and what a glance at a phone
// finds. Each state has its own icon and word, never colour alone.
import { CircleCheck, Clock, CircleX } from 'lucide-react';

const LOOKS = {
  accepted: { icon: CircleCheck, word: 'Accepted', tone: 'text-success-content' },
  waiting: { icon: Clock, word: 'Waiting', tone: 'text-warning-content' },
  declined: { icon: CircleX, word: 'Declined', tone: 'text-danger-content' },
};

export function ParticipantStates({ participants }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm" aria-label="Where everyone stands">
      {participants.map((person) => {
        const look = LOOKS[person.state] ?? LOOKS.waiting;
        const Icon = look.icon;
        return (
          <li key={person.membershipId} className="flex items-center gap-1.5">
            <Icon className={`size-4 shrink-0 ${look.tone}`} aria-hidden="true" />
            <span>
              <span className="text-content-primary">{person.isYou ? 'You' : person.name}</span>{' '}
              <span className={look.tone}>- {look.word}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
