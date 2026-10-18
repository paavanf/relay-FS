// chainLayout.js
// Where everything in a ChainDiagram goes. Pure geometry, apart from the
// drawing, so it can be tested.
//
// People sit evenly on a circle - the first at the top, or two side by side.
// Each hand-over is a gentle curve from the person giving the shift to the
// person taking it, bent away from the middle, so the two arrows of a direct
// swap never lie on top of each other.
//
// Arrowheads are where an earlier graphic here went wrong: its lines ran
// centre to centre, so the heads vanished under the circles. Here every
// curve starts GAP clear of the giver's circle and ends HEAD further back
// from the taker's, and the marker's base sits on that end. The end lies on
// the line from the taker's centre to the curve's control point, so the
// curve arrives pointing straight at the centre, and the head's tip lands
// exactly GAP clear of the circle.

export const VIEW_WIDTH = 320;
export const NODE_RADIUS = 24;
export const GAP = 6;
export const HEAD = 9;

const CIRCLE = { x: 160, y: 136, r: 94 };
const LABEL_OFFSET = 14;

/** How far below a circle's centre its name sits. */
export const NAME_BELOW = NODE_RADIUS + 14;

const round = (n) => Math.round(n * 10) / 10;

/** A point `distance` from `from`, heading toward `to`. */
export function toward(from, to, distance) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return { x: from.x + ((to.x - from.x) / length) * distance, y: from.y + ((to.y - from.y) / length) * distance };
}

export function placePeople(count) {
  const first = count === 2 ? Math.PI : -Math.PI / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = first + (2 * Math.PI * i) / count;
    return { x: CIRCLE.x + CIRCLE.r * Math.cos(angle), y: CIRCLE.y + CIRCLE.r * Math.sin(angle) };
  });
}

/** One hand-over's curve: its SVG path, the points that shape it, and where its label goes. */
export function arrowBetween(giver, taker, count) {
  const mid = { x: (giver.x + taker.x) / 2, y: (giver.y + taker.y) / 2 };
  // Outward is away from the circle's centre. Two people's midpoint IS the
  // centre, so they bend to the left of travel instead - opposite ways.
  let away = { x: mid.x - CIRCLE.x, y: mid.y - CIRCLE.y };
  if (Math.hypot(away.x, away.y) < 1) away = { x: taker.y - giver.y, y: giver.x - taker.x };
  const unit = toward({ x: 0, y: 0 }, away, 1);

  const bend = Math.hypot(taker.x - giver.x, taker.y - giver.y) * (count === 2 ? 0.3 : 0.18);
  const control = { x: mid.x + unit.x * bend, y: mid.y + unit.y * bend };
  const start = toward(giver, control, NODE_RADIUS + GAP);
  const end = toward(taker, control, NODE_RADIUS + GAP + HEAD);

  const halfway = { x: (start.x + 2 * control.x + end.x) / 4, y: (start.y + 2 * control.y + end.y) / 4 };
  const label = { x: round(halfway.x + unit.x * LABEL_OFFSET), y: round(halfway.y + unit.y * LABEL_OFFSET) };
  const path = `M ${round(start.x)} ${round(start.y)} Q ${round(control.x)} ${round(control.y)} ${round(end.x)} ${round(end.y)}`;
  return { path, start, control, end, label };
}

/**
 * The slice of the drawing worth showing: from just above the highest
 * circle or label to just below the lowest name, so two people side by side
 * are not floating in the space four would need.
 */
export function frameFor(places, labels) {
  const top = Math.min(...places.map((p) => p.y - NODE_RADIUS), ...labels.map((l) => l.y - 8)) - 8;
  const bottom = Math.max(...places.map((p) => p.y + NODE_RADIUS + NAME_BELOW + 8), ...labels.map((l) => l.y + 8)) + 6;
  return { y: Math.floor(top), height: Math.ceil(bottom - top) };
}
