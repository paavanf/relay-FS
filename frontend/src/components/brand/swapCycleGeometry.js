// swapCycleGeometry.js
// Where SwapCycleGraphic.jsx draws things: three shifts in a covering cycle,
// Mon -> Wed -> Fri -> Mon, and the arrows between them.
//
// The edges are trimmed back from each node's centre by the circle radius, so
// the arrowheads land in clear space instead of disappearing under a node.

export const NODE_RADIUS = 18;

// Clear space between a node's edge and the line that points at it.
const NODE_GAP = 4;

export const nodes = [
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
export const edges = nodes.map((from, i) => ({
  key: from.label,
  ...trimmedEdge(from, nodes[(i + 1) % nodes.length]),
}));
