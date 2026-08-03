import { test, expect } from '@playwright/test';
import {
  assignLabelRows,
  spreadSignposts,
  ARROW_MAX_NUDGE,
  ARROW_MIN_GAP,
  LABEL_GAP_X,
  LABEL_MAX_ROWS,
  LABEL_ROW_HEIGHT,
  type SignpostPoint,
} from '../src/pages/VR/signpostLayout';

/**
 * The signpost spacing, asserted on the geometry rather than through a camera.
 *
 * The browser test in vr-signposts.spec.ts walks the tour and checks nothing
 * overlaps on screen, which is the real claim — but which scene it reaches and
 * where the camera is pointing decide whether anything was ever crowded enough
 * to test. Measured: it passed with the spacing passes deliberately removed.
 * These run the crowding directly, so they fail the moment the arithmetic does.
 */

const distance = (a: SignpostPoint, b: SignpostPoint) => Math.hypot(a.x - b.x, a.y - b.y);

const closestPair = (points: SignpostPoint[]) => {
  let closest = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      closest = Math.min(closest, distance(points[i], points[j]));
    }
  }
  return closest;
};

const byId = (points: SignpostPoint[]) => new Map(points.map((p) => [p.id, p]));

test.describe('signpost layout', () => {
  /** The arrow artwork is 44 px at the size the tablet renders it. */
  const ARROW_SIZE = 44;

  test('two arrows on the same point separate by the full gap', () => {
    const crowded: SignpostPoint[] = [
      { id: 'liftlobby', x: 600, y: 400 },
      { id: 'podium2', x: 604, y: 403 },
    ];
    expect(closestPair(crowded), 'the fixture is not actually crowded').toBeLessThan(20);

    const spread = spreadSignposts(crowded);
    expect(spread).toHaveLength(crowded.length);
    expect(Math.round(closestPair(spread))).toBeGreaterThanOrEqual(ARROW_MIN_GAP - 1);
  });

  test('three arrows on the same point stop overlapping', () => {
    // Looking down a corridor at three destinations: metres apart on the floor,
    // a few pixels apart on screen. Three cannot all reach the full gap — that
    // would need a circle wider than the nudge clamp allows — so the claim here
    // is the one that matters on screen: no two of them overlap.
    const crowded: SignpostPoint[] = [
      { id: 'liftlobby', x: 600, y: 400 },
      { id: 'podium2', x: 604, y: 403 },
      { id: 'terrace1', x: 597, y: 396 },
    ];

    const spread = spreadSignposts(crowded);
    expect(Math.round(closestPair(spread))).toBeGreaterThan(ARROW_SIZE);
  });

  test('exactly coincident arrows still separate, and do so the same way twice', () => {
    const same: SignpostPoint[] = [
      { id: 'a', x: 300, y: 300 },
      { id: 'b', x: 300, y: 300 },
    ];

    const first = spreadSignposts(same);
    expect(Math.round(closestPair(first))).toBeGreaterThanOrEqual(ARROW_MIN_GAP - 1);
    // No randomness anywhere: the same input has to give the same output, or the
    // arrows would swap places between frames and flicker.
    expect(spreadSignposts(same)).toEqual(first);
  });

  test('no arrow is moved further than the clamp from where it really points', () => {
    const crowded: SignpostPoint[] = Array.from({ length: 5 }, (_, i) => ({
      id: `spot-${i}`,
      x: 500 + i,
      y: 400 - i,
    }));

    const spread = byId(spreadSignposts(crowded));
    for (const point of crowded) {
      const moved = spread.get(point.id)!;
      expect(
        Math.round(distance(point, moved)),
        `${point.id} drifted off its hotspot`,
      ).toBeLessThanOrEqual(ARROW_MAX_NUDGE);
    }
  });

  test('a row of arrows down a corridor is never made worse', () => {
    // Three in a line, each just inside the gap — the shape a corridor of
    // destinations projects to. Rearranging them must not bring any pair closer
    // together than they already were.
    const line: SignpostPoint[] = [
      { id: 'near', x: 400, y: 500 },
      { id: 'middle', x: 450, y: 500 },
      { id: 'far', x: 500, y: 500 },
    ];

    const spread = spreadSignposts(line);
    expect(Math.round(closestPair(spread))).toBeGreaterThanOrEqual(
      Math.round(closestPair(line)),
    );
  });

  test('four arrows in a heap all clear each other', () => {
    // Podium 1 offers four destinations, and they can all project into one spot.
    const heap: SignpostPoint[] = [
      { id: 'liftlobby', x: 700, y: 350 },
      { id: 'podium2', x: 703, y: 353 },
      { id: 'terrace1', x: 698, y: 347 },
      { id: 'entrygate', x: 701, y: 346 },
    ];

    const spread = spreadSignposts(heap);
    expect(Math.round(closestPair(spread))).toBeGreaterThan(ARROW_SIZE);
  });

  test('a lone arrow is left exactly where it projects', () => {
    const single: SignpostPoint[] = [{ id: 'dropoff', x: 812.5, y: 431.25 }];
    expect(spreadSignposts(single)).toEqual(single);
  });

  test('name pills that would overprint drop to their own rows', () => {
    // The Terrace Amenities case from the screenshots: three pills, all wide,
    // all landing on the same line.
    const points: SignpostPoint[] = [
      { id: 'terrace2', x: 860, y: 640 },
      { id: 'terrace', x: 900, y: 645 },
      { id: 'podium1', x: 880, y: 660 },
    ];
    const widths = new Map([
      ['terrace2', 210], // TERRACE FOOD COURT
      ['terrace', 200], // MULTIPURPOSE COURT
      ['podium1', 90], // PODIUM
    ]);

    const rows = assignLabelRows(points, (id) => widths.get(id));
    expect(new Set(rows.values()).size, `all three pills share a row: ${[...rows]}`).toBe(3);

    // And the rows they were given genuinely clear each other.
    for (const a of points) {
      for (const b of points) {
        if (a.id >= b.id) continue;
        const sameRow = rows.get(a.id) === rows.get(b.id);
        const overlapX =
          Math.abs(a.x - b.x) < (widths.get(a.id)! + widths.get(b.id)!) / 2 + LABEL_GAP_X;
        expect(sameRow && overlapX, `${a.id} and ${b.id} still overprint`).toBe(false);
      }
    }
  });

  test('pills far apart all stay on the first row', () => {
    const points: SignpostPoint[] = [
      { id: 'left', x: 100, y: 400 },
      { id: 'right', x: 900, y: 400 },
    ];
    const rows = assignLabelRows(points, () => 120);
    expect([...rows.values()]).toEqual([0, 0]);
  });

  test('the stack is capped rather than running off the screen', () => {
    // Six identical pills at one point cannot all have a row of their own.
    const points: SignpostPoint[] = Array.from({ length: 6 }, (_, i) => ({
      id: `spot-${i}`,
      x: 500,
      y: 300,
    }));
    const rows = assignLabelRows(points, () => 180);
    expect(Math.max(...rows.values())).toBeLessThan(LABEL_MAX_ROWS);
    expect(LABEL_MAX_ROWS * LABEL_ROW_HEIGHT).toBeLessThan(120);
  });

  test('a pill of unknown width never displaces a measured one', () => {
    const points: SignpostPoint[] = [
      { id: 'measured', x: 500, y: 300 },
      { id: 'unmeasured', x: 505, y: 302 },
    ];
    // Width is unknown for the first frame after a scene change. Whatever the
    // guess costs, it must cost the pill that is guessing — the measured one
    // stays where it was going to be.
    const rows = assignLabelRows(points, (id) => (id === 'measured' ? 160 : undefined));
    expect(rows.get('measured')).toBe(0);
    expect(rows.get('unmeasured')).toBe(1);
  });
});
