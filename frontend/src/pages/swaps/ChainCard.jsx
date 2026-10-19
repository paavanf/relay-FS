// ChainCard - one proposed swap: what would happen, as sentences and as a
// diagram with where everyone stands; its status and how long it has left
// (or how it ended); and, below, whatever the person looking can do now.
//
// The sentences start from the person looking, when they are in it ("Asha
// takes your night shift..."), and use names when they are not. Stacked on
// a phone - people answer these on their phones - side by side on a wide
// screen.
import { useEffect, useRef } from 'react';
import { Badge } from '../../components/ui/Badge.jsx';
import { ChainDiagram } from '../../features/swaps/components/ChainDiagram.jsx';
import { chainSentences } from '../../features/swaps/chainSentences.js';
import { STATUS_WORDS, howItEnded, diagramLabel } from '../../features/swaps/chainWords.js';
import { isLive } from '../../features/swaps/chainSections.js';
import { TimeLeft } from './TimeLeft.jsx';
import { ParticipantStates } from './ParticipantStates.jsx';

export function ChainCard({ chain, onTimeUp, actions, highlight = false }) {
  const you = chain.participants.find((person) => person.isYou);
  const sentences = chainSentences(chain, {
    requesterId: you?.membershipId ?? chain.proposer.membershipId,
    viewerIsRequester: Boolean(you),
  });
  const states = Object.fromEntries(chain.participants.map((person) => [person.membershipId, person.state]));
  const status = STATUS_WORDS[chain.status] ?? STATUS_WORDS.proposed;

  // A proposal just made from an option is brought into view, outlined.
  const card = useRef(null);
  useEffect(() => {
    if (highlight) card.current?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  return (
    <li
      ref={card}
      aria-label={`Swap proposed by ${chain.proposer.name}`}
      className={`rounded-lg border bg-surface-raised elevation-sm ${highlight ? 'border-brand-border' : 'border-line-subtle'}`}
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant={status.variant}>{status.label}</Badge>
            {isLive(chain) && <TimeLeft expiresAt={chain.expiresAt} onTimeUp={onTimeUp} />}
          </div>
          <ul className="space-y-1.5 text-body text-content-primary">
            {sentences.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
          {!isLive(chain) && <p className="text-body-sm text-content-secondary">{howItEnded(chain)}</p>}
          <ParticipantStates participants={chain.participants} />
        </div>

        <ChainDiagram
          option={chain}
          youId={you?.membershipId}
          states={states}
          label={diagramLabel(chain)}
          className="mx-auto max-w-[19rem] md:w-60 md:shrink-0"
        />
      </div>

      {actions && <div className="border-t border-line-subtle px-4 py-3">{actions}</div>}
    </li>
  );
}
