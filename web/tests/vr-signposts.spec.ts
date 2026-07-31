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

    const hovered = await onVisibleArrow(
      page,
      async (arrow) => {
        await arrow.hover({ force: true, timeout: 3_000 });
        // The reveal is a 150 ms fade, and reading it in the same tick as the
        // hover returns the fade's starting value rather than its end.
        await page.waitForTimeout(400);
        const shown = await opacity(arrow);
        if (shown !== '1') throw new Error(`name still at opacity ${shown}`);
        return shown;
      },
      'hovering an arrow never revealed its destination name',
    );
    expect(hovered, 'hovering the arrow left its destination name hidden').toBe('1');
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
    await expect
      .poll(
        () =>
          page
            .locator(ARROWS)
            .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join('|')),
        {
          message: `tapping "${destination}" did not move the tour`,
          timeout: 25_000,
        },
      )
      .not.toBe(destination);
  });
});
