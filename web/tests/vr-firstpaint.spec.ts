import { test, expect, type Page } from '@playwright/test';
import { url, login, waitForCachingToSettle, assertCanvasPainted } from './helpers';

/**
 * How long does /vr sit black before the user can see where they are?
 *
 * Two different numbers matter and conflating them hides the bug:
 *
 *   firstVisible — when ANY of the scene is on screen. This is what the
 *                  complaint was about; a black screen is a black screen.
 *   sharp        — when the full-resolution panorama is on the sphere.
 *
 * A first attempt sampled full-page screenshots in a loop. That was useless:
 * decoding a 6000×3000 panorama blocks the main thread, so the screenshot call
 * itself stalled ~35 s and the measurement mostly measured its own contention.
 * Both numbers here come from cheap in-page probes instead, with one pixel
 * assertion at the end to confirm the probes meant something.
 */

interface Timings {
  firstVisible: number | null;
  sharp: number | null;
  firstMedia: { url: string; ms: number; bytes: number | null } | null;
}

async function measure(page: Page): Promise<Timings> {
  // Route changes here are hash changes on an already-loaded document, so the
  // performance timeline does not restart. Take our own origin.
  const t0 = await page.evaluate(() => performance.now());

  const started = Date.now();
  await page.goto(url('/vr'));

  // ── firstVisible: the blurred preview arriving. It is a plain CSS
  //    background, so the browser paints it as soon as the bytes land. ──
  const firstVisible = await page
    .waitForFunction(
      (since) => {
        const hit = performance
          .getEntriesByType('resource')
          .find(
            (e) => /\/media\/previews\//.test(e.name) && e.responseEnd > (since as number),
          );
        return hit ? Math.round(hit.responseEnd - (since as number)) : false;
      },
      t0,
      { timeout: 30_000, polling: 50 },
    )
    .then((h) => h.jsonValue() as Promise<number>)
    .catch(() => null);

  // ── sharp: the app's own cover fading out, which happens once the full
  //    texture is on the sphere. ──
  await page
    .waitForFunction(
      () => {
        const covers = [...document.querySelectorAll('div')].filter((d) => {
          const s = getComputedStyle(d);
          return (
            s.position === 'absolute' &&
            s.backgroundColor === 'rgb(0, 0, 0)' &&
            d.getBoundingClientRect().width > window.innerWidth * 0.9
          );
        });
        if (covers.length === 0) return false;
        return covers.every((c) => Number(getComputedStyle(c).opacity) < 0.05);
      },
      undefined,
      { timeout: 120_000, polling: 100 },
    )
    .catch(() => {});

  const sharp = Date.now() - started;

  const firstMedia = await page.evaluate((since) => {
    const entries = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((e) => /\/media\/(vr|optimized)\//.test(e.name) && e.responseEnd > (since as number))
      .sort((a, b) => a.responseEnd - b.responseEnd);
    const first = entries[0];
    return first
      ? {
          url: first.name,
          ms: Math.round(first.responseEnd - first.startTime),
          bytes: first.encodedBodySize || first.transferSize || null,
        }
      : null;
  }, t0);

  return { firstVisible, sharp, firstMedia };
}

function report(label: string, t: Timings): void {
  console.log(
    `[vr-firstpaint ${label}] firstVisible=${t.firstVisible ?? 'n/a'} ms · sharp=${t.sharp} ms · ` +
      `first full-res response ${t.firstMedia?.ms ?? '?'} ms / ` +
      `${t.firstMedia?.bytes ? (t.firstMedia.bytes / 1048576).toFixed(1) : '?'} MB · ` +
      `${t.firstMedia?.url ?? 'n/a'}`,
  );
}

test('warm cache: /vr shows the scene immediately and never goes black', async ({ page }) => {
  await login(page);
  await waitForCachingToSettle(page);

  const t = await measure(page);
  report('WARM', t);
  await assertCanvasPainted(page, '/vr warm');

  expect(t.firstVisible, 'no preview was ever requested — run `npm run panos:optimize`').not.toBeNull();
  expect(t.firstVisible!, 'the scene took over 800ms to appear at all').toBeLessThan(800);
  expect(t.sharp, 'the full-resolution panorama took over 4s').toBeLessThan(4000);
});

test('cold: someone taps VR while the library is still downloading', async ({ page }) => {
  await login(page);

  const t = await measure(page);
  report('COLD', t);
  await assertCanvasPainted(page, '/vr cold');

  expect(t.firstVisible, 'no preview was ever requested').not.toBeNull();
  expect(t.firstVisible!, 'the scene took over 1.5s to appear at all').toBeLessThan(1500);
  expect(t.sharp, 'the full-resolution panorama took over 8s').toBeLessThan(8000);
});
