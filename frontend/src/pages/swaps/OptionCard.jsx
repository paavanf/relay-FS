// OptionCard - one swap option: what would happen, as sentences and as a
// picture; why it sits where it does; and a Propose button that is honest
// about not working yet.
//
// The sentences are the accessible version of the diagram, which is a single
// labelled image. Side by side on a wide screen, stacked on a phone.
import { useId } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { ChainDiagram } from '../../features/swaps/components/ChainDiagram.jsx';
import { chainSentences } from '../../features/swaps/chainSentences.js';
import { whyThisOne } from '../../features/swaps/whyThisOne.js';

function diagramLabel(option) {
  const names = option.legs.map((leg) => leg.to.name);
  return option.size === 2
    ? `Diagram of a direct swap between ${names.join(' and ')}`
    : `Diagram of a ${option.size}-person swap chain between ${names.join(', ')}`;
}

export function OptionCard({ option, request }) {
  const noteId = useId();
  const requesterId = request.requester.membershipId;
  const sentences = chainSentences(option, { requesterId, viewerIsRequester: request.mine });

  return (
    <li className="rounded-lg border border-line-subtle bg-surface-raised elevation-sm">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-3">
          <ul className="space-y-1.5 text-body text-content-primary">
            {sentences.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
          <p className="text-body-sm text-content-secondary">{whyThisOne(option.score)}</p>
        </div>

        <ChainDiagram
          option={option}
          youId={request.mine ? requesterId : null}
          label={diagramLabel(option)}
          className="mx-auto max-w-[19rem] md:w-60 md:shrink-0"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line-subtle px-4 py-3">
        <Button size="sm" disabled aria-describedby={noteId}>
          Propose this swap
        </Button>
        <p id={noteId} className="text-body-sm text-content-tertiary">
          Proposing arrives in the next update. Looking reserves nothing and tells nobody.
        </p>
      </div>
    </li>
  );
}
