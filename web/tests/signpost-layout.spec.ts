import { test, expect } from '@playwright/test';
import {
  placeLabels,
  spreadSignposts,
  ARROW_MAX_NUDGE,
  ARROW_MIN_GAP,
  ARROW_SIZE,
  LABEL_GAP,
  type LabelSize,
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

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const arrowBox = (point: SignpostPoint): Box => ({
  left: point.x - ARROW_SIZE / 2,
  right: point.x + ARROW_SIZE / 2,
  top: point.y - ARROW_SIZE / 2,
  bottom: point.y + ARROW_SIZE / 2,
});

/** Where a pill actually lands, given the offset the layout pass chose. */
const pillBox = (point: SignpostPoint, size: LabelSize, offset: { dx: number; dy: number }): Box => ({
  left: point.x + offset.dx - size.width / 2,
  right: point.x + offset.dx + size.width / 2,
  top: point.y + offset.dy - size.height / 2,
  bottom: point.y + offset.dy + size.height / 2,
});

const PILL_HEIGHT = 22;
const pill = (width: number): LabelSize => ({ width, height: PILL_HEIGHT });

test.describe('signpost layout', () => {
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
    // a few pixels apart on screen.
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
    const line: SignpostPoint[] = [
      { id: 'near', x: 400, y: 500 },
      { id: 'middle', x: 450, y: 500 },
      { id: 'far', x: 500, y: 500 },
    ];

    const spread = spreadSignposts(line);
    expect(Math.round(closestPair(spread))).toBeGreaterThanOrEqual(Math.round(closestPair(line)));
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

  test('a lone name sits directly beneath its arrow', () => {
    const single: SignpostPoint[] = [{ id: 'dropoff', x: 800, y: 400 }];
    const offset = placeLabels(single, () => pill(120)).get('dropoff')!;

    expect(offset.dx, 'an uncrowded name should not be pushed sideways').toBeCloseTo(0, 6);
    expect(offset.dy).toBeCloseTo(ARROW_SIZE / 2 + LABEL_GAP + PILL_HEIGHT / 2, 5);
  });

  /**
   * The failure in the screenshot: "TERRACE FOOD COURT" was laid across the
   * arrow next to it, and three names stacked in a column under four arrows
   * left no way to tell which name belonged to which.
   */
  test('no name is laid across any arrow, its own or anyone else’s', () => {
    const crowded: SignpostPoint[] = [
      { id: 'terrace2', x: 900, y: 420 },
      { id: 'terrace', x: 960, y: 460 },
      { id: 'podium1', x: 905, y: 500 },
    ];
    const sizes = new Map<string, LabelSize>([
      ['terrace2', pill(210)], // TERRACE FOOD COURT
      ['terrace', pill(200)], // MULTIPURPOSE COURT
      ['podium1', pill(90)], // PODIUM
    ]);

    const spread = spreadSignposts(crowded);
    const offsets = placeLabels(spread, (id) => sizes.get(id));

    for (const point of spread) {
      const box = pillBox(point, sizes.get(point.id)!, offsets.get(point.id)!);
      for (const other of spread) {
        expect(
          overlaps(box, arrowBox(other)),
          `"${point.id}" name covers the "${other.id}" arrow`,
        ).toBe(false);
      }
    }
  });

  test('names never overprint each other', () => {
    const crowded: SignpostPoint[] = [
      { id: 'terrace2', x: 900, y: 420 },
      { id: 'terrace', x: 960, y: 460 },
      { id: 'podium1', x: 905, y: 500 },
      { id: 'liftlobby', x: 860, y: 455 },
    ];
    const sizes = new Map<string, LabelSize>([
      ['terrace2', pill(210)],
      ['terrace', pill(200)],
      ['podium1', pill(90)],
      ['liftlobby', pill(120)],
    ]);

    const spread = spreadSignposts(crowded);
    const offsets = placeLabels(spread, (id) => sizes.get(id));
    const boxes = spread.map((point) => ({
      id: point.id,
      box: pillBox(point, sizes.get(point.id)!, offsets.get(point.id)!),
    }));

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(
          overlaps(boxes[i].box, boxes[j].box),
          `"${boxes[i].id}" and "${boxes[j].id}" overprint`,
        ).toBe(false);
      }
    }
  });

  test('every name stays touching its own arrow', () => {
    // What makes a name readable as *that* arrow's name: it never drifts off to
    // float between them.
    const crowded: SignpostPoint[] = [
      { id: 'a', x: 700, y: 400 },
      { id: 'b', x: 760, y: 430 },
      { id: 'c', x: 690, y: 470 },
    ];
    const offsets = placeLabels(spreadSignposts(crowded), () => pill(160));

    for (const [id, offset] of offsets) {
      const reach = Math.hypot(offset.dx, offset.dy);
      // Half the arrow, the gap, and at most half the pill in each direction.
      expect(reach, `"${id}" floated away from its arrow`).toBeLessThanOrEqual(
        ARROW_SIZE / 2 + LABEL_GAP + 160 / 2 + 1,
      );
    }
  });

  test('placement is deterministic', () => {
    const crowded: SignpostPoint[] = [
      { id: 'a', x: 500, y: 300 },
      { id: 'b', x: 540, y: 320 },
      { id: 'c', x: 505, y: 355 },
    ];
    const spread = spreadSignposts(crowded);
    // Same geometry, same answer — anything else is a pill hopping around the
    // arrow between frames.
    expect([...placeLabels(spread, () => pill(140))]).toEqual([
      ...placeLabels(spread, () => pill(140)),
    ]);
  });

  test('a pill of unknown size is placed without displacing a measured one', () => {
    // Far enough apart that neither arrow is in the other's way, so the only
    // thing that could move the measured pill is the unmeasured one's guess.
    const points: SignpostPoint[] = [
      { id: 'measured', x: 300, y: 300 },
      { id: 'unmeasured', x: 900, y: 300 },
    ];
    // Sizes are unknown for the first frame after a scene change. Whatever the
    // guess costs, it must cost the pill that is guessing.
    const offsets = placeLabels(points, (id) => (id === 'measured' ? pill(160) : undefined));
    expect(offsets.get('measured')!.dx).toBeCloseTo(0, 6);
    expect(offsets.get('measured')!.dy).toBeGreaterThan(0);
    expect(offsets.has('unmeasured')).toBe(true);
  });

  test('a name is moved aside by an arrow that is not its own', () => {
    // The exact failure in the screenshot: "TERRACE FOOD COURT" hung off its own
    // arrow and landed across the one beside it. Its own arrow is clear either
    // way, so nothing but the neighbour can push it off "beneath".
    const points: SignpostPoint[] = [
      { id: 'wide', x: 500, y: 300 },
      { id: 'neighbour', x: 560, y: 341 },
    ];
    const offsets = placeLabels(points, (id) => (id === 'wide' ? pill(200) : pill(60)));
    expect(
      Math.abs(offsets.get('wide')!.dx),
      'the wide name stayed beneath, straight over the next arrow',
    ).toBeGreaterThan(0);
  });
});
