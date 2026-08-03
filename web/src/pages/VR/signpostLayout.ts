/**
 * Screen-space layout for the VR tour's signposts.
 *
 * Hotspots that are metres apart on the floor project a few pixels apart when
 * you are looking down a corridor at them. The arrows then stack into a single
 * smudge and their name pills overprint into an unreadable run — "PODIUM 1"
 * across "CAFETERIA" rendering as "PODIUM 1FETERIA", "BACK TO COURT" sitting on
 * top of "BACK TO START".
 *
 * Both passes run every frame, on projected pixel coordinates, and both are
 * pure: they are here rather than inside VRPage's render loop so the geometry
 * can be asserted directly instead of through a camera that happens to be
 * pointing the right way.
 */

export interface SignpostPoint {
  id: string;
  x: number;
  y: number;
}

/** Centre-to-centre distance below which two arrows read as a single blob. */
export const ARROW_MIN_GAP = 78;
/** The arrow artwork, at the size the tablet draws it. */
export const ARROW_SIZE = 44;
/** Clearance between an arrow's edge and the name pill beside it. */
export const LABEL_GAP = 8;
/**
 * How far an arrow may be pushed off its true projected point.
 *
 * Bounded on purpose: an arrow's job is to say "there is somewhere to go, that
 * way", and pushing it across the screen would point it at the wrong doorway.
 * A tap walks by destination id rather than by position, so a nudge this size
 * costs nothing and keeps the arrows distinguishable.
 *
 * Sized against what three coincident arrows need: they can only separate onto
 * a circle of this radius, and an equilateral triangle inscribed in it has
 * sides of r * sqrt(3), so reaching a 78 px gap needs 45. Beyond three the
 * clamp wins and the guarantee weakens to "no two arrows overlap", which is
 * what the tests assert.
 */
export const ARROW_MAX_NUDGE = 48;

/**
 * Group points that are too close, including transitively: A near B and B near
 * C puts all three in one group, because moving B has to account for both.
 */
function cluster(points: readonly SignpostPoint[], minGap: number): number[][] {
  const groupOf = points.map((_, index) => index);

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y) >= minGap) continue;
      const [from, to] = [groupOf[j], groupOf[i]];
      if (from === to) continue;
      for (let k = 0; k < groupOf.length; k += 1) if (groupOf[k] === from) groupOf[k] = to;
    }
  }

  const groups = new Map<number, number[]>();
  groupOf.forEach((group, index) => {
    const members = groups.get(group);
    if (members) members.push(index);
    else groups.set(group, [index]);
  });
  return [...groups.values()];
}

/**
 * Push arrows apart until none of them sits on top of another.
 *
 * Returns new points; the input is untouched. Each result is clamped back to
 * within `maxNudge` of where it really projects, so a crowded scene loses the
 * pile-up without any arrow drifting away from what it points at.
 *
 * A crowded group is laid out on a ring around its own centre rather than
 * relaxed apart pair by pair. Relaxation was the first attempt and it settles
 * badly on the case that matters: three arrows a few pixels apart came out 77,
 * 42 and 38 px apart, because each pair pushes at once and the pushes partly
 * cancel — one pair ends up flung well past the gap while another never
 * reaches it. A ring is one step, symmetric, and exact.
 *
 * Ring radius comes from the chord: n points evenly spaced on a circle of
 * radius r are 2 * r * sin(pi / n) apart, so r = minGap / (2 * sin(pi / n)) is
 * the radius that puts neighbours exactly one gap apart. Where that exceeds
 * `maxNudge` the clamp wins and the guarantee softens from "a full gap" to "no
 * two arrows overlap" — which is still the thing you can see.
 *
 * Angles are taken from where each arrow already is, so the ring preserves the
 * arrangement the visitor is looking at: an arrow to the left stays to the
 * left. Anything exactly coincident has no angle to keep, and falls back to its
 * index so that identical input always gives identical output.
 */
export function spreadSignposts(
  points: readonly SignpostPoint[],
  { minGap = ARROW_MIN_GAP, maxNudge = ARROW_MAX_NUDGE } = {},
): SignpostPoint[] {
  if (points.length < 2) return points.map((point) => ({ ...point }));

  const spread = points.map((point) => ({ ...point }));

  for (const group of cluster(points, minGap)) {
    if (group.length < 2) continue;

    const centreX = group.reduce((sum, i) => sum + points[i].x, 0) / group.length;
    const centreY = group.reduce((sum, i) => sum + points[i].y, 0) / group.length;

    const around = group
      .map((index) => {
        const dx = points[index].x - centreX;
        const dy = points[index].y - centreY;
        return {
          index,
          // Coincident points share a centre and so have no angle of their own.
          angle: Math.hypot(dx, dy) < 0.01 ? null : Math.atan2(dy, dx),
        };
      })
      .sort((a, b) => (a.angle ?? Infinity) - (b.angle ?? Infinity) || a.index - b.index);

    const step = (2 * Math.PI) / group.length;
    const radius = Math.min(maxNudge, minGap / (2 * Math.sin(Math.PI / group.length)));
    // Anchor the ring to whichever arrow already has a direction, so the whole
    // group is not rotated away from where the visitor last saw it.
    const base = around.find((member) => member.angle !== null)?.angle ?? 0;

    around.forEach((member, position) => {
      const angle = base + position * step;
      spread[member.index].x = centreX + radius * Math.cos(angle);
      spread[member.index].y = centreY + radius * Math.sin(angle);
    });
  }

  return spread.map((point, index) => {
    const origin = points[index];
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= maxNudge) return point;
    const scale = maxNudge / distance;
    return { ...point, x: origin.x + dx * scale, y: origin.y + dy * scale };
  });
}

export interface LabelSize {
  width: number;
  height: number;
}

/** Offset of a name pill's centre from its arrow's centre, in pixels. */
export interface LabelOffset {
  dx: number;
  dy: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * The eight places a pill can sit around its arrow, clockwise from below.
 *
 * Screen coordinates, so +y is down and 90 degrees is directly beneath the
 * arrow — where a single uncrowded name belongs and where it stays, because
 * that candidate is tried first.
 */
const PLACEMENTS = [90, 45, 135, 0, 180, -45, -135, -90].map((degrees) => ({
  degrees,
  radians: (degrees * Math.PI) / 180,
}));

const angleBetween = (a: number, b: number) => {
  const difference = Math.abs(((a - b + 540) % 360) - 180);
  return difference;
};

/**
 * Put every name pill beside its own arrow, out of the way of the others.
 *
 * Stacking the pills into rows under the cluster was the first attempt, and it
 * traded one problem for two: a pill sat across the arrow next to it, and with
 * three names in a column under four arrows there was no way to tell which name
 * belonged to which. So each pill is now placed against its own arrow and the
 * eight positions around it are tried in turn — beneath first, so an uncrowded
 * signpost looks exactly as it did, then outwards, away from the middle of the
 * cluster, so a crowded group fans its names out rather than inwards.
 *
 * A candidate is rejected if it covers any arrow — including arrows other than
 * its own, which is the case in the screenshots — or a pill already placed. If
 * every candidate is rejected the outward one is used anyway: a name in a
 * slightly awkward spot beats a name that vanished.
 *
 * `sizeOf` returns a pill's measured box. Nothing is measured on the first
 * frame after a scene change; an unmeasured pill is treated as a point, so it
 * can be moved out of another's way but can never push a measured one aside on
 * the strength of a guess.
 */
export function placeLabels(
  points: readonly SignpostPoint[],
  sizeOf: (id: string) => LabelSize | undefined,
  { arrowSize = ARROW_SIZE, gap = LABEL_GAP } = {},
): Map<string, LabelOffset> {
  const placed = new Map<string, LabelOffset>();
  if (points.length === 0) return placed;

  const arrowHalf = arrowSize / 2;
  const arrowBoxes = points.map((point) => ({
    left: point.x - arrowHalf,
    right: point.x + arrowHalf,
    top: point.y - arrowHalf,
    bottom: point.y + arrowHalf,
  }));

  const centreX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const centreY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  // Ties broken by id so the result depends on nothing that can differ between
  // two frames showing the same thing.
  const ordered = [...points].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  const taken: Box[] = [];

  for (const point of ordered) {
    const size = sizeOf(point.id) ?? { width: 0, height: 0 };

    const outward =
      Math.hypot(point.x - centreX, point.y - centreY) < 0.01
        ? 90 // dead centre of its own group: no way out, so keep it beneath.
        : (Math.atan2(point.y - centreY, point.x - centreX) * 180) / Math.PI;

    const candidates = [...PLACEMENTS].sort((a, b) => {
      // Beneath always leads; the rest follow the way out of the cluster.
      if (a.degrees === 90) return -1;
      if (b.degrees === 90) return 1;
      return angleBetween(a.degrees, outward) - angleBetween(b.degrees, outward);
    });

    let chosen: LabelOffset | null = null;
    let fallback: LabelOffset | null = null;

    for (const candidate of candidates) {
      const dx = Math.cos(candidate.radians) * (arrowHalf + gap + size.width / 2);
      const dy = Math.sin(candidate.radians) * (arrowHalf + gap + size.height / 2);
      const box: Box = {
        left: point.x + dx - size.width / 2,
        right: point.x + dx + size.width / 2,
        top: point.y + dy - size.height / 2,
        bottom: point.y + dy + size.height / 2,
      };
      fallback ??= { dx, dy };
      if (arrowBoxes.some((arrow) => overlaps(box, arrow))) continue;
      if (taken.some((other) => overlaps(box, other))) continue;
      taken.push(box);
      chosen = { dx, dy };
      break;
    }

    placed.set(point.id, chosen ?? fallback!);
  }

  return placed;
}
