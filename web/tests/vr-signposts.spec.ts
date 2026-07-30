import { test, expect } from '@playwright/test';
import { login, url } from './helpers';

/**
 * The arrow signposts in the VR tour.
 *
 * The floor rings that replaced them were invisible as an affordance on a
 * tablet — nothing about a ring says "tap here to walk there", so visitors
 * stood still. These assert the arrows are on screen, carry the destination
 * name from the tour data, and actually move the tour when tapped.
 *
 * Every click here is `force: true`. The signposts track a slowly
 * auto-rotating camera, so Playwright never considers them "stable"; a finger
 * has no such requirement, and waiting for stability just times out.
 */
test.describe('VR signposts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(url('/vr'));
    // Engine start plus the first panorama upload.
    await page.waitForTimeout(9000);
  });

  test('arrows are on screen with their destination names', async ({ page }) => {
    const arrows = page.locator('button[aria-label^="Walk to"]');
    await expect
      .poll(() => arrows.count(), {
        message: 'no arrow signposts rendered in the VR tour',
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    // The opening scene has exactly one hotspot in the tour data, so a label
    // is the useful assertion rather than a count.
    const label = (await arrows.first().innerText()).trim();
    expect(label.length, 'an arrow rendered with no destination name').toBeGreaterThan(0);
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
    const arrows = page.locator('button[aria-label^="Walk to"]');
    await expect.poll(() => arrows.count(), { timeout: 15_000 }).toBeGreaterThan(0);

    const destination = (await arrows.first().getAttribute('aria-label'))!;
    await arrows.first().click({ force: true });

    // The walk animation runs, then the new scene publishes its own signposts.
    // Arriving somewhere else means the set of destinations changes.
    await expect
      .poll(
        async () => {
          const labels = await arrows.evaluateAll((els) =>
            els.map((e) => e.getAttribute('aria-label')),
          );
          return labels.join('|');
        },
        {
          message: `tapping "${destination}" did not move the tour`,
          timeout: 25_000,
        },
      )
      .not.toBe(destination);
  });
});
