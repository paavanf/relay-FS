// SwapCycleGraphic - the static illustration on the auth brand panel.
//
// It draws what Relay actually does: three shifts in a covering cycle, each
// person taking the next one's shift. Mon -> Wed -> Fri -> Mon.
//
// The edges are trimmed back from each node's centre by the circle radius, so
// the arrowheads land in clear space instead of disappearing under a node.
// Colour comes from `currentColor`, set once on the <svg>, which is also what
// lets the marker pick up the theme - marker contents inherit from where they
// sit in the document, not from the line that references them.

const NODE_RADIUS = 18;

// Clear space between a node's edge and the line that points at it.
const NODE_GAP = 4;

const ARROW_ID = 'relay-swap-arrow';

const nodes = [
  { cx: 110, cy: 40, label: 'Mon' },
  { cx: 186, cy: 160, label: 'Wed' },
  { cx: 34, cy: 160, label: 'Fri' },
];

// Shortens a centre-to-centre line at both ends so it runs between the two
// circles rather than through them.
function trimmedEdge(from, to) {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const length = Math.hypot(dx, dy);

  const offsetX = (dx / length) * (NODE_RADIUS + NODE_GAP);
  const offsetY = (dy / length) * (NODE_RADIUS + NODE_GAP);

  return {
    x1: from.cx + offsetX,
    y1: from.cy + offsetY,
    x2: to.cx - offsetX,
    y2: to.cy - offsetY,
  };
}

// Each node points at the next one, and the last wraps back to the first.
const edges = nodes.map((from, i) => ({
  key: from.label,
  ...trimmedEdge(from, nodes[(i + 1) % nodes.length]),
}));

export function SwapCycleGraphic({ className }) {
  return (
    <svg
      viewBox="0 0 220 200"
      fill="none"
      className={className ?? 'w-full max-w-[260px] text-brand-600'}
      role="img"
      aria-label="Three shifts covering each other in a cycle: Monday to Wednesday to Friday and back"
    >
      <defs>
        {/* refX sits on the tip, so the point lands exactly on the line end.
            markerUnits="strokeWidth" keeps the head in proportion if the
            stroke ever changes weight. */}
        <marker
          id={ARROW_ID}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
        </marker>
      </defs>

      {edges.map((edge) => (
        <line
          key={edge.key}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd={`url(#${ARROW_ID})`}
        />
      ))}

      {nodes.map((node) => (
        <g key={node.label}>
          <circle cx={node.cx} cy={node.cy} r={NODE_RADIUS} className="fill-brand-50" />
          <circle
            cx={node.cx}
            cy={node.cy}
            r={NODE_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <text
            x={node.cx}
            y={node.cy + 4}
            textAnchor="middle"
            className="fill-ink-muted text-[11px] font-medium"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
