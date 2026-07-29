import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import {
  ROUTES,
  VIDEO_ROUTES,
  CANVAS_ROUTES,
  url,
  gotoRoute,
  login,
  clearEverything,
  waitForCachingToSettle,
  assertReallyOffline,
  assertImagesDecoded,
  assertCanvasPainted,
  assertVideoLayout,
  readVideoState,
} from './helpers';

/**
 * The acceptance criterion for the whole project: after one load on the
 * network, everything works with the network off.
 *
 * One serial block over ONE shared context, because the state under test *is*
 * the sequence — sign in, let it download, cut the network, then assert. A
 * per-test context would throw the CacheStorage away and silently re-download
 * ~510 MB for every assertion, which is both unusable and a different scenario
 * from the one being claimed.
 */
let context: BrowserContext;
let page: Page;

const test = base.extend({});

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

test.describe('offline', () => {
  test('sign in and download the full library', async () => {
    await clearEverything(context, page);
    await login(page);

    // Rule 31: never cut the network mid-download. Wait for the entry count to
    // stop growing rather than guessing at a duration.
    const entries = await waitForCachingToSettle(page);
    console.log(`[offline] cache settled at ${entries} entries`);

    const progress = await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Offline status"]');
      return el?.textContent ?? '';
    });
    console.log(`[offline] status pill: ${progress}`);

    // 111 media files + 43 precache entries. Assert a floor, not an exact
    // number — the manifest legitimately contains duplicates (rule 9).
    expect(entries, 'far fewer entries cached than the manifest lists').toBeGreaterThan(140);
  });

  test('the network is genuinely off before anything is asserted', async () => {
    await login(page);
    await context.setOffline(true);
    // Rule 29: prove it with a request that must hit the network.
    await assertReallyOffline(page);
    await context.setOffline(false);
  });

  test('every route renders real content offline', async () => {
    await login(page);
    await waitForCachingToSettle(page, { quietMs: 2500 });

    await context.setOffline(true);
    await assertReallyOffline(page);

    const summary: string[] = [];
    for (const route of ROUTES) {
      await gotoRoute(page, route.path);
      // The document must actually be the app, not a browser error page.
      await expect(page.locator('#root'), `${route.name}: #root missing offline`).toHaveCount(1);

      const painted = await page.evaluate(() => {
        const root = document.getElementById('root');
        return { children: root?.childElementCount ?? 0, text: (root?.innerText ?? '').length };
      });
      expect(painted.children, `${route.name}: #root is empty offline`).toBeGreaterThan(0);

      // Rule 25: assert bytes were decoded, not that elements exist.
      const images = await assertImagesDecoded(page, route.name);
      summary.push(`${route.name}: ${images} image(s) decoded, ${painted.text} chars`);
    }
    console.log('[offline routes]\n' + summary.join('\n'));

    await context.setOffline(false);
  });

  test('the brochure PDF is available offline', async () => {
    await login(page);
    await waitForCachingToSettle(page, { quietMs: 2500 });
    await context.setOffline(true);
    await assertReallyOffline(page);

    // The brochure ships as a hashed bundle asset; find it in the precache and
    // fetch it with the network down.
    const result = await page.evaluate(async () => {
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          if (request.url.endsWith('.pdf')) {
            const response = await fetch(request.url);
            const buffer = await response.arrayBuffer();
            const head = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 5)));
            return { url: request.url, bytes: buffer.byteLength, head };
          }
        }
      }
      return null;
    });

    expect(result, 'no PDF found in any cache').not.toBeNull();
    // A cached-but-empty or HTML-fallback response is the failure mode here.
    expect(result!.head, `served ${result!.url} but it is not a PDF`).toBe('%PDF-');
    expect(result!.bytes).toBeGreaterThan(100_000);
    console.log(`[offline pdf] ${result!.url} — ${(result!.bytes / 1048576).toFixed(1)} MB`);

    await context.setOffline(false);
  });

  test('videos are laid out correctly and load offline', async ({}, testInfo) => {
    await login(page);
    await waitForCachingToSettle(page, { quietMs: 2500 });
    await context.setOffline(true);
    await assertReallyOffline(page);

    // The Windows/Linux WebKit build ships without proprietary codecs, so it
    // cannot decode H.264. Layout is still fully testable there; decoding is
    // not, and pretending otherwise would be the exact mistake rule 26 warns
    // about. Stated in the output so the claim's limits travel with the result.
    const webkitNoH264 = testInfo.project.name.startsWith('webkit');

    for (const route of VIDEO_ROUTES) {
      await gotoRoute(page, route);
      await page.waitForTimeout(2500);

      // Rule 26: layout first — this is what a readyState-only test misses.
      await assertVideoLayout(page, route);

      const state = await readVideoState(page);
      console.log(
        `[offline video] ${route} — ${state.primary!.rectW}x${state.primary!.rectH} box, ` +
          `readyState=${state.primary!.readyState}, intrinsic=${state.primary!.videoWidth}x${state.primary!.videoHeight}`,
      );

      // The src must resolve root-relative (rule 5), never against the route.
      expect(state.primary!.src, `${route}: video src is not root-relative`).toMatch(
        /^https?:\/\/[^/]+\/(media|assets)\//,
      );

      if (webkitNoH264) {
        console.log(`[offline video] ${route} — decode NOT verified (WebKit build lacks H.264)`);
        continue;
      }

      await expect
        .poll(async () => (await readVideoState(page)).primary!.readyState, {
          message: `${route}: video never reached readyState >= 2 offline`,
          timeout: 30_000,
        })
        .toBeGreaterThanOrEqual(2);

      const decoded = await readVideoState(page);
      expect(decoded.primary!.videoWidth, `${route}: no decoded frame`).toBeGreaterThan(0);

      // Rule 17: seeking issues Range requests. If the worker cannot serve a
      // 206 from cache, this is where offline playback falls over.
      const seeked = await page.evaluate(async () => {
        // The largest *rendered* video, not the first in DOM order — the first
        // is often the inactive responsive layout's copy.
        const video = [...document.querySelectorAll('video')]
          .filter((v) => v.offsetParent !== null)
          .sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            return rb.width * rb.height - ra.width * ra.height;
          })[0];
        if (!video || !video.duration || !isFinite(video.duration)) return null;
        const target = Math.min(video.duration * 0.6, video.duration - 0.5);
        video.currentTime = target;
        await new Promise((resolve) => {
          const done = () => resolve(null);
          video.addEventListener('seeked', done, { once: true });
          setTimeout(done, 8000);
        });
        return { requested: target, actual: video.currentTime, error: video.error?.code ?? null };
      });
      if (seeked) {
        expect(seeked.error, `${route}: media error after seeking offline`).toBeNull();
        expect(
          Math.abs(seeked.actual - seeked.requested),
          `${route}: seek offline did not land (range requests not served from cache?)`,
        ).toBeLessThan(2);
        console.log(`[offline video] ${route} — seek to ${seeked.requested.toFixed(1)}s OK`);
      }
    }

    await context.setOffline(false);
  });

  test('the VR canvas actually paints offline', async () => {
    await login(page);
    await waitForCachingToSettle(page, { quietMs: 2500 });
    await context.setOffline(true);
    await assertReallyOffline(page);

    for (const route of CANVAS_ROUTES) {
      await gotoRoute(page, route);
      // WebGL panoramas take a moment to upload textures.
      await page.waitForTimeout(6000);
      // Rule 25: count non-blank pixels. A black canvas is the failure symptom.
      await assertCanvasPainted(page, route);
      console.log(`[offline canvas] ${route} — painted`);
    }

    await context.setOffline(false);
  });

  test('a full reload works offline', async () => {
    await login(page);
    await waitForCachingToSettle(page, { quietMs: 2500 });

    await context.setOffline(true);
    await assertReallyOffline(page);

    // Not an SPA navigation — the document itself must come from the worker.
    await page.goto(url('/amenities'));
    await page.reload();
    await expect(page.locator('#root')).toHaveCount(1);
    const children = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? 0);
    expect(children, 'the app shell did not come back after an offline reload').toBeGreaterThan(0);
    await expect(page).not.toHaveURL(/#\/login/);

    await context.setOffline(false);
  });
});
