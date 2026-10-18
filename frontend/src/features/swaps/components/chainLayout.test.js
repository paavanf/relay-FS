// chainLayout.test.js
// The diagram's geometry - above all its arrowheads. Every curve must start
// clear of the giver's circle and arrive pointing at the centre of the
// person taking the shift, with the head's tip in the gap before their
// circle: never hidden under it, never askew. An earlier graphic here drew
// lines centre to centre and lost its heads under the nodes.

import { describe, it, expect } from 'vitest';
import { placePeople, arrowBetween, toward, frameFor, NODE_RADIUS, GAP, HEAD, NAME_BELOW } from './chainLayout.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mean = (places, axis) => places.reduce((sum, p) => sum + p[axis], 0) / places.length;
const centreOf = (places) => ({ x: mean(places, 'x'), y: mean(places, 'y') });

// The hand-overs of a chain in the order the API lists them: person i takes
// the shift of person i + 1, so each arrow runs from i + 1 to i.
const arrowsFor = (places) =>
  places.map((taker, i) => ({ taker, giver: places[(i + 1) % places.length], ...arrowBetween(places[(i + 1) % places.length], taker, places.length) }));

describe('placing people', () => {
  it.each([2, 3, 4])('spaces %i people evenly round one circle', (count) => {
    const places = placePeople(count);
    const centre = centreOf(places);
    const radii = places.map((p) => distance(p, centre));
    const sides = places.map((p, i) => distance(p, places[(i + 1) % count]));

    radii.forEach((r) => expect(r).toBeCloseTo(radii[0]));
    sides.forEach((side) => expect(side).toBeCloseTo(sides[0]));
  });
});

describe('arrows', () => {
  it.each([2, 3, 4])('with %i people, start clear of the giver and stop with the head clear of the taker', (count) => {
    for (const { giver, taker, start, end, control } of arrowsFor(placePeople(count))) {
      expect(distance(start, giver)).toBeCloseTo(NODE_RADIUS + GAP);
      expect(distance(end, taker)).toBeCloseTo(NODE_RADIUS + GAP + HEAD);

      // orient="auto" turns the head along the curve's last tangent, from the
      // control point to the end. Its tip, HEAD further on, must land GAP
      // clear of the circle - which also means it is aimed at the centre.
      const tip = toward(control, end, distance(control, end) + HEAD);
      expect(distance(tip, taker)).toBeCloseTo(NODE_RADIUS + GAP);
    }
  });

  it("bends a direct swap's two arrows to opposite sides, so neither hides the other", () => {
    const [left, right] = placePeople(2);
    const there = arrowBetween(left, right, 2);
    const back = arrowBetween(right, left, 2);

    expect(Math.sign(there.control.y - left.y)).toBe(-Math.sign(back.control.y - left.y));
    expect(Math.abs(there.label.y - back.label.y)).toBeGreaterThan(40);
  });

  it('writes a path that runs from the start to the end', () => {
    const [taker, giver] = placePeople(3);
    const arrow = arrowBetween(giver, taker, 3);
    const numbers = arrow.path.match(/-?\d+(\.\d+)?/g).map(Number);
    const rounded = (point) => [point.x, point.y].map((n) => Math.round(n * 10) / 10);

    expect(numbers.slice(0, 2)).toEqual(rounded(arrow.start));
    expect(numbers.slice(-2)).toEqual(rounded(arrow.end));
  });
});

describe('the frame', () => {
  it.each([2, 3, 4])('holds every circle, name and label of %i people', (count) => {
    const places = placePeople(count);
    const labels = arrowsFor(places).map((arrow) => arrow.label);
    const { y, height } = frameFor(places, labels);

    for (const p of places) {
      expect(p.y - NODE_RADIUS).toBeGreaterThan(y);
      expect(p.y + NAME_BELOW + 6).toBeLessThan(y + height);
    }
    for (const label of labels) expect(label.y).toBeGreaterThan(y);
  });
});
