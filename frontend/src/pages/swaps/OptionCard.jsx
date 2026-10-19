// OptionCard - one swap option: what would happen, as sentences and as a
// picture; why it sits where it does; and the Propose button.
//
// Only the person whose offer it is can propose it - a manager looking at
// someone else's options is told so instead. Proposing asks for a
// confirmation first (ProposeDialog); looking still reserves nothing.
//
// The sentences are the accessible version of the diagram, which is a single
// labelled image. Side by side on a wide screen, stacked on a phone.
import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { ChainDiagram } from '../../features/swaps/components/ChainDiagram.jsx';
import { chainSentences } from '../../features/swaps/chainSentences.js';
import { whyThisOne } from '../../features/swaps/whyThisOne.js';
import { diagramLabel } from '../../features/swaps/chainWords.js';
import { ProposeDialog } from './ProposeDialog.jsx';

export function OptionCard({ option, request, onProposed }) {
  const [isProposing, setIsProposing] = useState(false);
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
        {request.mine ? (
          <>
            <Button size="sm" onClick={() => setIsProposing(true)}>
              Propose this swap
            </Button>
            <p className="text-body-sm text-content-tertiary">Everyone else in it is asked to accept. Looking reserves nothing.</p>
          </>
        ) : (
          <p className="text-body-sm text-content-tertiary">Only {request.requester.name} can propose a swap for this shift.</p>
        )}
      </div>

      {isProposing && <ProposeDialog option={option} request={request} onClose={() => setIsProposing(false)} onProposed={onProposed} />}
    </li>
  );
}
