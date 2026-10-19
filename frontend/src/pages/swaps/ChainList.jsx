// ChainList - a titled list of proposed swaps, each a ChainCard with the
// actions the person looking can take. `empty` is the sentence to show when
// there are none; without one, an empty list is left out altogether.
import { canActOn } from '../../features/swaps/chainSections.js';
import { ChainCard } from './ChainCard.jsx';
import { ChainActions } from './ChainActions.jsx';

export function ChainList({ title, description, chains, empty, onTimeUp, highlightId }) {
  if (chains.length === 0 && !empty) return null;

  return (
    <section aria-label={title}>
      <h2 className="text-h3 text-content-primary">{title}</h2>
      {description && <p className="mt-0.5 text-body-sm text-content-secondary">{description}</p>}

      {chains.length === 0 ? (
        <p className="mt-2 text-body-sm text-content-secondary">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {chains.map((chain) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onTimeUp={onTimeUp}
              highlight={chain.id === highlightId}
              actions={canActOn(chain) ? <ChainActions chain={chain} /> : null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
