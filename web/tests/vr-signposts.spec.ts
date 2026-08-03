import { test, expect, type Locator, type Page } from '@playwright/test';
import { login, url } from './helpers';

/**
 * The arrow signposts in the VR tour.
 *
 * The floor rings that replaced them were invisible as an affordance on a
 * tablet — nothing about a ring says "tap here to walk there", so visitors
 * stood still. These assert the arrows are on screen, carry the destination
 * name from the tour data, reveal that name on hover, and actually move the
 * tour when tapped.
 *
 * Every touch here is `force: true`. The signposts track a slowly
 * auto-rotating camera, so Playwright never considers them "stable"; a finger
 * has no such requirement, and waiting for stability just times out.
 *
 * `:visible` is not optional. Every destination of the current scene has a
 * signpost node at all times — they are kept mounted so their positions can be
 * written straight onto the DOM each frame without React re-rendering — and the
 * ones behind the camera are hidden rather than removed. Only the visible ones
 * are what a visitor can actually reach.
 */
const ARROWS = 'button[aria-label^="Walk to"]:visible';

/**
 * Every signpost the current scene mounted, on screen or not.
 *
 * The destinations a scene offers do not depend on where the camera is
 * pointing, so this is the right locator for "did the tour move" — see the
 * comment in that test for how `:visible` made it pass for the wrong reason.
 */
const ALL_ARROWS = 'button[aria-label^="Walk to"]';

/** The label inside a signpost. The other span only wraps the artwork. */
const nameOf = (arrow: Locator) => arrow.locator('span', { hasText: /\S/ }).last();

/**
 * Long enough for an arrow to come back around.
 *
 * The tour auto-rotates at 5°/s and the opening scene has a single hotspot, so
 * that arrow spends most of a 72-second lap behind the camera — where it is
 * hidden, and so not something a visitor or a test can touch.
 */
const LAP_MS = 90_000;

/**
 * Retry `action` against the first on-screen signpost until it goes through.
 *
 * Finding a visible arrow and then touching it are two steps, and the camera
 * keeps moving between them — so the arrow can slip out of view in the gap.
 * Retrying the whole find-and-touch is what makes this deterministic. The short
 * inner timeout matters: without it the action would wait out the whole test on
 * a locator that currently matches nothing.
 */
const onVisibleArrow = async <T>(page: Page, action: (arrow: Locator) => Promise<T>, message: string) => {
  let result: T | undefined;
  await expect
    .poll(
      async () => {
        try {
          result = await action(page.locator(ARROWS).first());
          return true;
        } catch {
          return false;
        }
      },
      { message, timeout: LAP_MS },
    )
    .toBe(true);
  return result as T;
};

test.describe('VR signposts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(url('/vr'));
    // Engine start plus the first panorama upload.
    await page.waitForTimeout(9000);
  });

  test('arrows are on screen with their destination names', async ({ page }) => {
    const arrows = page.locator(ARROWS);
    await expect
      .poll(() => arrows.count(), {
        message: 'no arrow signposts rendered in the VR tour',
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    // The opening scene has exactly one hotspot in the tour data, so a label
    // is the useful assertion rather than a count.
    const label = await onVisibleArrow(
      page,
      async (arrow) => (await arrow.innerText({ timeout: 3_000 })).trim(),
      'no arrow signpost came into view',
    );
    expect(label.length, 'an arrow rendered with no destination name').toBeGreaterThan(0);
  });

  test('the destination name is a hover reveal', async ({ page }) => {
    const opacity = (arrow: Locator) =>
      nameOf(arrow).evaluate((el) => getComputedStyle(el).opacity, undefined, { timeout: 3_000 });

    // Twelve arrows each shouting their destination buried the panorama, so the
    // name is held back until the pointer is on the arrow.
    const idle = await onVisibleArrow(page, opacity, 'no arrow signpost came into view');
    expect(idle, 'the destination name is showing before anything was hovered').toBe('0');

    // Hover, then poll — do not sample once after a fixed wait.
    //
    // The arrow tracks a camera rotating at 5°/s, which at this FOV carries it
    // about 27 px in 400 ms across a 60 px button. So a cursor parked at the
    // centre sits inside the button, then near its edge, then outside it, and a
    // single reading 400 ms later catches the reveal at 1, mid-fade, or already
    // faded back out depending on where in that drift it lands. Measured: four
    // consecutive attempts read 0.03, 0.82, 0, 1.
    //
    // Re-hovering each lap keeps the pointer on the arrow the way a real one
    // would follow it, and polling asserts the actual claim — that hovering
    // reveals the name — instead of asserting it is still revealed at one
    // arbitrary instant.
    const arrow = page.locator(ARROWS).first();
    await expect
      .poll(
        async () => {
          try {
            await arrow.hover({ force: true, timeout: 3_000 });
            // The reveal is a 150 ms fade; give it room to finish.
            await page.waitForTimeout(200);
            return await opacity(arrow);
          } catch (error) {
            // Returned, not swallowed, so it lands in the `Received:` line.
            // The original helper caught everything and returned false, so a
            // 90 s timeout was the entire report and the reason never got out.
            return `threw: ${String((error as Error).message).split('\n')[0]}`;
          }
        },
        {
          message: 'hovering an arrow never revealed its destination name',
          timeout: LAP_MS,
        },
      )
      .toBe('1');
  });

  test('on a touch device the names are shown, because nothing can hover', async ({ browser }) => {
    // The tour ships on an iPad. The engine only raycasts for hover on a
    // pointer that is not pressed, and a finger is always pressed — so
    // `hoveredId` never fires there, and CSS :hover never matches either.
    // Before this was handled, the destination name sat at opacity 0 before,
    // during and after a tap on both engines: twelve unlabelled arrows, which
    // is the problem the labels exist to solve.
    const context = await browser.newContext({
      viewport: { width: 1180, height: 820 },
      hasTouch: true,
    });
    const touchPage = await context.newPage();
    try {
      expect(
        await touchPage.evaluate(() => matchMedia('(hover: hover)').matches),
        'this context is supposed to be a touch device',
      ).toBe(false);

      await login(touchPage);
      await touchPage.goto(url('/vr'));
      await touchPage.waitForTimeout(9000);

      const arrow = touchPage.locator(ARROWS).first();
      await expect
        .poll(
          async () => {
            try {
              return await nameOf(arrow).evaluate((el) => getComputedStyle(el).opacity, undefined, {
                timeout: 3_000,
              });
            } catch (error) {
              return `threw: ${String((error as Error).message).split('\n')[0]}`;
            }
          },
          {
            message: 'no arrow showed its destination name without being hovered',
            timeout: LAP_MS,
          },
        )
        .toBe('1');
    } finally {
      await context.close();
    }
  });

  /**
   * The flicker regression.
   *
   * The positions used to be React state pushed from the render callback,
   * throttled to 30 Hz and rounded to whole pixels — so the arrows were
   * repainted at half the rate of the panorama behind them, in one-pixel snaps.
   * Against a smoothly auto-rotating scene that reads as a shimmer.
   *
   * Sampling consecutive animation frames is what tells the two apart: the
   * throttled version could not change on more than about half of them.
   */
  test('the arrows track the camera on every frame', async ({ page }) => {
    const framesThatMoved = async () => {
      const samples = await page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const el = document.querySelector<HTMLElement>('button[aria-label^="Walk to"]');
            if (!el) return resolve([]);
            const out: string[] = [];
            const tick = () => {
              out.push(getComputedStyle(el).transform);
              if (out.length < 13) requestAnimationFrame(tick);
              else resolve(out);
            };
            requestAnimationFrame(tick);
          }),
      );
      return samples.filter((t, i) => i > 0 && t !== samples[i - 1]).length;
    };

    // Sampled while the tour is idling: nothing has been touched since the page
    // loaded, so the camera is on its own slow auto-rotate — the exact state the
    // shimmer was most visible in. 12 transitions, allowing a couple to be
    // dropped to a skipped frame on a busy machine.
    await expect
      .poll(framesThatMoved, {
        message: 'the arrows are not repositioned every frame — the 30 Hz stutter is back',
        timeout: LAP_MS,
      })
      .toBeGreaterThanOrEqual(10);
  });

  test('the arrow artwork loads and is rotated by the tour data', async ({ page }) => {
    const state = await page.evaluate(() => {
      const img = document.querySelector<HTMLImageElement>('button[aria-label^="Walk to"] img');
      if (!img) return null;
      return { src: img.getAttribute('src'), decoded: img.naturalWidth > 0 };
    });

    expect(state, 'no arrow image inside the signpost').not.toBeNull();
    expect(state!.src).toBe('/VR/arrowfinal.png');
    // naturalWidth is the only proof the bytes arrived — a 404 still leaves an
    // <img> in the DOM, which is how a missing arrow would slip through.
    expect(state!.decoded, 'the arrow image element exists but never decoded').toBe(true);
  });

  test('tapping an arrow walks to the next scene', async ({ page }) => {
    const destination = await onVisibleArrow(
      page,
      async (arrow) => {
        const label = await arrow.getAttribute('aria-label', { timeout: 3_000 });
        await arrow.click({ force: true, timeout: 3_000 });
        return label!;
      },
      'no arrow signpost came into view to tap',
    );

    // The walk animation runs, then the new scene publishes its own signposts.
    // Arriving somewhere else means the set of destinations changes.
    //
    // Every mounted signpost, not just the visible ones. "The set of
    // destinations" is a property of the scene; which of them the camera
    // happens to be facing is not. Polling `:visible` made this pass by
    // accident: arrows behind the camera used to be left visible at nonsense
    // coordinates, which padded the joined string so it never equalled a
    // single label. Once projectMarker started hiding them properly, the
    // visible set was often just one arrow — and on the way back from
    // Reception that one is "Walk to Entry Gate", identical to `destination`,
    // so a tour that had moved correctly reported that it had not.
    await expect
      .poll(
        () =>
          page
            .locator(ALL_ARROWS)
            .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join('|')),
        {
          message: `tapping "${destination}" did not move the tour`,
          timeout: 25_000,
        },
      )
      .not.toBe(destination);
  });

  /**
   * Signposts must not pile up on each other.
   *
   * Hotspots metres apart on the floor project a few pixels apart when you are
   * looking down a corridor at them. Every arrow in Drop Off, Podium 1 and the
   * Sports Zone landed in one smudge, and the name pills overprinted into a
   * single unreadable run — "PODIUM 1" over "CAFETERIA" rendering as
   * "PODIUM 1FETERIA", "BACK TO COURT" sitting across "BACK TO START".
   *
   * Measured on a touch context because that is where every name is shown at
   * once (nothing can hover, so nothing is held back) and the tour's actual
   * device. Sampled repeatedly rather than once: the camera auto-rotates, so
   * the arrangement is different every second and a single reading proves
   * nothing about the arrangement two seconds later.
   */
  test('arrows and their names never overlap each other', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1180, height: 820 },
      hasTouch: true,
    });
    const touchPage = await context.newPage();

    try {
      await login(touchPage);
      await touchPage.goto(url('/vr'));
      await touchPage.waitForTimeout(9000);

      // The opening scene has one hotspot, so it cannot collide with anything.
      // Drop Off, one walk away, has three.
      //
      // Keep tapping until the tour is actually somewhere with more than one
      // destination. A single tap is not enough to rely on: the arrow tracks a
      // moving camera and can leave the screen between being found and being
      // touched, and a run where the walk quietly did not happen sampled a
      // one-arrow scene twenty times and reported that spacing was fine.
      await expect
        .poll(
          async () => {
            const mounted = await touchPage.locator(ALL_ARROWS).count();
            if (mounted > 1) return mounted;
            try {
              await touchPage.locator(ARROWS).first().click({ force: true, timeout: 3_000 });
            } catch {
              /* nothing on screen this instant — the camera will bring one back */
            }
            await touchPage.waitForTimeout(2500);
            return touchPage.locator(ALL_ARROWS).count();
          },
          {
            message: 'never reached a scene with more than one destination',
            timeout: LAP_MS,
          },
        )
        .toBeGreaterThan(1);
      // Let the walk settle before measuring anything.
      await touchPage.waitForTimeout(3000);

      const sample = () =>
        touchPage.evaluate(() => {
          const overlap = (a: DOMRect, b: DOMRect) =>
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

          const spots = [...document.querySelectorAll<HTMLElement>('button[aria-label^="Walk to"]')]
            .filter((button) => getComputedStyle(button).visibility !== 'hidden')
            .map((button) => {
              const pill = [...button.querySelectorAll<HTMLElement>('span')].find((span) =>
                span.textContent?.trim(),
              );
              const box = button.getBoundingClientRect();
              return {
                name: pill?.textContent?.trim() ?? '?',
                centre: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
                // Only a pill that is actually painted can collide with another.
                pill:
                  pill && Number(getComputedStyle(pill).opacity) > 0.5
                    ? pill.getBoundingClientRect()
                    : null,
                // Written by the layout pass, not by a class.
                pillPositioned: Boolean(pill?.style.transform),
              };
            });

          // Proof the layout pass is actually wired to these nodes. The
          // geometry is asserted directly in signpost-layout.spec.ts; what this
          // adds is that its answers reach the DOM — a detached ref or a
          // renamed class would leave the pills where CSS put them and every
          // spacing assertion below would pass by doing nothing.
          const unpositioned = spots.filter((spot) => spot.pill && !spot.pillPositioned);

          const collisions: string[] = [];
          let closest = Infinity;
          for (let i = 0; i < spots.length; i += 1) {
            for (let j = i + 1; j < spots.length; j += 1) {
              const a = spots[i];
              const b = spots[j];
              closest = Math.min(
                closest,
                Math.hypot(a.centre.x - b.centre.x, a.centre.y - b.centre.y),
              );
              if (a.pill && b.pill && overlap(a.pill, b.pill)) {
                collisions.push(`"${a.name}" overprints "${b.name}"`);
              }
            }
          }
          return {
            count: spots.length,
            collisions,
            closest,
            unpositioned: unpositioned.map((spot) => spot.name),
          };
        });

      let sawMultiple = false;
      // ~24 s, which is two thirds of a lap at 5 deg/s — long enough for the
      // arrows to move through every arrangement this scene can produce.
      for (let i = 0; i < 24; i += 1) {
        const { count, collisions, closest, unpositioned } = await sample();
        expect(
          unpositioned,
          'name pill(s) never got a position from the layout pass',
        ).toEqual([]);
        if (count > 1) {
          sawMultiple = true;
          expect(collisions, `name pills overlapping: ${collisions.join('; ')}`).toEqual([]);
          // Pushed apart in screen space, then clamped back towards the real
          // point — so this is the clamp's floor, not the target gap.
          expect(
            Math.round(closest),
            'two arrows are drawn on top of each other',
          ).toBeGreaterThanOrEqual(36);
        }
        await touchPage.waitForTimeout(1000);
      }

      expect(
        sawMultiple,
        'never saw two signposts on screen at once, so nothing about spacing was tested',
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
});
