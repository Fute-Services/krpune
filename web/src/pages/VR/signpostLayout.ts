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
export const ARROW_MIN_GAP = 58;
/**
 * How far an arrow may be pushed off its true projected point.
 *
 * Bounded on purpose: an arrow's job is to say "there is somewhere to go, that
 * way", and pushing it across the screen would point it at the wrong doorway.
 * A tap walks by destination id rather than by position, so a nudge this size
 * costs nothing and keeps the arrows distinguishable.
 *
 * 36 rather than 30 because of what three coincident arrows need: they can only
 * separate onto a circle of this radius, and an equilateral triangle inscribed
 * in it has sides of r * sqrt(3). At 30 that is 52 px and the full gap is
 * unreachable; at 36 it is 62. Beyond three the clamp wins and the guarantee
 * weakens to "no two arrows visually overlap", which is what the tests assert.
 */
export const ARROW_MAX_NUDGE = 36;
/** Vertical step between stacked name pills — pill height plus breathing room. */
export const LABEL_ROW_HEIGHT = 26;
/** Horizontal clearance between two pills before they count as colliding. */
export const LABEL_GAP_X = 10;
/** Past this many rows the stack itself becomes the clutter. */
export const LABEL_MAX_ROWS = 3;

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

/**
 * Drop a name pill to the next row when it would overprint another.
 *
 * Two pills collide when their horizontal spans overlap and they sit on roughly
 * the same line. Order is by y, then x, then id — the last one only so that the
 * result depends on nothing that can change between two frames at the same
 * geometry, which is what would make a pill flicker between rows.
 *
 * `widthOf` returns a pill's measured width. On the first frame after a scene
 * change nothing has been measured yet; an unknown width counts as a point
 * rather than as a box, so a pill that has not been measured can be pushed down
 * a row but can never push a measured one down on the strength of a guess.
 */
export function assignLabelRows(
  points: readonly SignpostPoint[],
  widthOf: (id: string) => number | undefined,
  { rowHeight = LABEL_ROW_HEIGHT, gapX = LABEL_GAP_X, maxRows = LABEL_MAX_ROWS } = {},
): Map<string, number> {
  const ordered = [...points].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  const taken: { left: number; right: number; y: number }[] = [];
  const assigned = new Map<string, number>();

  for (const point of ordered) {
    const width = widthOf(point.id) ?? 0;
    const left = point.x - width / 2 - gapX;
    const right = point.x + width / 2 + gapX;

    let row = 0;
    // `maxRows` counts rows, so the last usable index is one below it. Off by
    // one here and six crowded pills stacked four deep instead of three.
    while (row < maxRows - 1) {
      const y = point.y + row * rowHeight;
      const clash = taken.some(
        (other) =>
          left < other.right && right > other.left && Math.abs(y - other.y) < rowHeight,
      );
      if (!clash) break;
      row += 1;
    }

    taken.push({ left, right, y: point.y + row * rowHeight });
    assigned.set(point.id, row);
  }

  return assigned;
}
