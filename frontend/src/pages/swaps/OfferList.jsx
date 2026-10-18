// OfferList - a titled list of open swap offers, each with "Find swaps".
// `empty` is what to show when there are none: a sentence, or a whole panel.
import { OfferItem } from './OfferItem.jsx';

export function OfferList({ title, requests, empty, selectedId, onFind, showRequester = false }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-h3 text-content-primary">{title}</h2>

      {requests.length === 0 &&
        (typeof empty === 'string' ? <p className="text-body-sm text-content-secondary">{empty}</p> : empty)}

      {requests.length > 0 && (
        <ul className="space-y-2">
          {requests.map((request) => (
            <OfferItem
              key={request.id}
              request={request}
              isSelected={request.id === selectedId}
              onFind={onFind}
              showRequester={showRequester}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
