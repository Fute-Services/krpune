import type { Page, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * The router is a *hash* router (src/app/router.tsx uses createHashRouter), so
 * every route lives after a '#'. Testing '/vr' instead of '/#/vr' would load
 * the index document, render the home page, and quietly pass or quietly fail
 * for the wrong reason (rule 27).
 */
export const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/location', name: 'location' },
  { path: '/vr', name: 'vr' },
  { path: '/amenities', name: 'amenities' },
  { path: '/project_details', name: 'project-details' },
  { path: '/blueprint', name: 'blueprint' },
  { path: '/aboutus', name: 'about-us' },
  { path: '/overview', name: 'overview' },
  { path: '/gallery', name: 'gallery' },
  { path: '/sustainability', name: 'sustainability' },
  { path: '/concept_summary', name: 'concept-summary' },
  { path: '/projectinfo', name: 'project-info' },
  { path: '/terrace-level', name: 'terrace-level' },
  { path: '/podium-level', name: 'podium-level' },
  { path: '/ground-level', name: 'ground-level' },
  { path: '/lobby-reception', name: 'lobby-reception' },
  { path: '/mobility', name: 'mobility' },
  { path: '/vertical-transport', name: 'vertical-transport' },
  { path: '/fitout-plan', name: 'fitout-plan' },
  { path: '/circulation-plan', name: 'circulation-plan' },
  { path: '/walkthrough', name: 'walkthrough' },
  { path: '/construction', name: 'construction' },
  { path: '/unitplan/1', name: 'unit-plan' },
];

/** Routes whose page is built around a <video> element. */
export const VIDEO_ROUTES = [
  '/walkthrough',
  '/construction',
  '/circulation-plan',
  '/mobility',
  '/vertical-transport',
];

/** Routes that render through a WebGL canvas. */
export const CANVAS_ROUTES = ['/vr'];

export const CREDENTIALS = { email: 'krcpune@gmail.com', password: 'krcpune123' };

export function url(path: string): string {
  return `/#${path}`;
}

export async function gotoRoute(page: Page, path: string): Promise<void> {
  // A goto to the URL we are already on is a reload, and reloading offline is
  // where Playwright's WebKit build falls over — `page.goto`/`page.reload` to
  // the current URL with the context offline throws "WebKit encountered an
  // internal error" even though the worker has the document cached and
  // navigating to a *different* route offline works fine on the same page.
  // For a "visit every route" loop that reload was never the point, so skip it
  // rather than let a harness limitation read as a broken offline app.
  // Reload is covered on its own in offline.spec.ts.
  const target = new URL(url(path), page.url()).href;
  if (page.url() === target) return;

  await page.goto(url(path));
  await page.waitForLoadState('load');
}

/**
 * Idempotent: the offline suite shares one context across tests, so by the
 * second test the session already exists and /login redirects straight into the
 * app. Filling a form that is not on screen would fail for a reason that has
 * nothing to do with what is being tested.
 */
export async function login(page: Page): Promise<void> {
  await page.goto(url('/login'));
  const emailField = page.locator('#email');
  if ((await emailField.count()) === 0) {
    await expect(page).not.toHaveURL(/#\/login/);
    return;
  }
  await emailField.fill(CREDENTIALS.email);
  await page.fill('#password', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
}

/**
 * Rule 29: navigator.onLine is not evidence. Chrome does not reliably flip it,
 * which has produced false failures before. Prove the network is really down by
 * making a request that MUST hit it and asserting it throws.
 */
export async function assertReallyOffline(page: Page): Promise<void> {
  const reachedNetwork = await page.evaluate(async () => {
    try {
      // Query string guarantees this was never cached by anything.
      await fetch(`/__offline_probe__?nonce=${Math.random()}`, { cache: 'no-store' });
      return true;
    } catch {
      return false;
    }
  });
  expect(reachedNetwork, 'a network request succeeded — the browser is NOT offline').toBe(false);
}

/**
 * Rule 31: cutting the network mid-download caches a partial set and the next
 * assertion fails for the wrong reason.
 *
 * Prefer the downloader's own verdict, read from window.__krcOffline(); fall
 * back to polling the cache entry count until it stops growing, for the states
 * that never reach 'complete' (a failed file leaves it on 'error').
 *
 * That verdict used to be read out of the corner status pill's text. The pill
 * was removed from the UI — see OfflineStatus — so the downloader publishes its
 * progress on window instead, and this is the only thing watching it now.
 */
export async function waitForCachingToSettle(
  page: Page,
  { quietMs = 4000, timeoutMs = 12 * 60 * 1000 } = {},
): Promise<number> {
  const start = Date.now();
  let last = -1;
  let lastChange = Date.now();

  for (;;) {
    const { count, status } = await page.evaluate(async () => {
      let total = 0;
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) total += (await (await caches.open(name)).keys()).length;
      }
      // The app's own verdict, which beats any heuristic about entry counts.
      return { count: total, status: window.__krcOffline?.().status ?? null };
    });

    // Ask the downloader rather than guessing. The quiet-period fallback below
    // measures "the entry count stopped growing", and writing a 100 MB video on
    // a loaded machine looks exactly like that — so on a slow run it returned
    // mid-download and the next test failed on an image that simply had not
    // been fetched yet. 'complete' is the downloader saying every file in the
    // manifest is in the cache.
    if (status === 'complete') return count;

    if (count !== last) {
      last = count;
      lastChange = Date.now();
    } else if (Date.now() - lastChange >= quietMs) {
      return count;
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`caching did not settle within ${timeoutMs}ms (stuck at ${count} entries)`);
    }
    await page.waitForTimeout(1000);
  }
}

export async function cacheEntryCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    if (!('caches' in window)) return 0;
    const names = await caches.keys();
    let total = 0;
    for (const name of names) total += (await (await caches.open(name)).keys()).length;
    return total;
  });
}

export async function serviceWorkerCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 0;
    return (await navigator.serviceWorker.getRegistrations()).length;
  });
}

/**
 * Rule 25: "an <img> exists" is not "the image rendered". A broken image still
 * produces an element; only naturalWidth proves bytes were decoded.
 */
export async function assertImagesDecoded(page: Page, label: string): Promise<number> {
  const read = () =>
    page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter((img) => {
        const r = img.getBoundingClientRect();
        const style = getComputedStyle(img);
        return (
          r.width > 2 && r.height > 2 && style.visibility !== 'hidden' && style.display !== 'none'
        );
      });
      return {
        total: imgs.length,
        broken: imgs.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
      };
    });

  // Polled, not sampled once. A single read asserts "every image had decoded by
  // the instant I looked", which is not the claim — a 2 MB JPEG served from the
  // cache still takes a moment to decode, and this reported it as a broken image
  // in a run where the file was provably cached whole. Waiting distinguishes
  // "slow" from "missing"; a genuinely absent file never decodes at all.
  await expect
    .poll(async () => (await read()).broken, {
      message: `${label}: image(s) never decoded`,
      timeout: 20_000,
    })
    .toEqual([]);

  return (await read()).total;
}

/**
 * Rule 25: assert on rendered pixels. "A canvas exists" is not "the scene
 * rendered" — an all-black WebGL canvas is the exact symptom of a panorama that
 * failed to load.
 *
 * Reading the pixels back in-page does NOT work here, and getting that wrong
 * produced a confident false failure: three.js creates its context without
 * `preserveDrawingBuffer`, so by the time script runs again the drawing buffer
 * has been cleared and both `getImageData` and `drawImage(canvas, …)` return an
 * empty frame. It reports "canvas is black" for a scene that is plainly visible.
 *
 * A Playwright element screenshot goes through the compositor instead, so it
 * captures what is actually on screen. The PNG is then decoded with ffmpeg
 * (already a dependency of `npm run audit:videos`) and the pixels counted here.
 */
export async function assertCanvasPainted(page: Page, label: string): Promise<void> {
  const count = await page.locator('canvas').count();
  expect(count, `${label}: no canvas on the page`).toBeGreaterThan(0);

  // Largest canvas = the scene, not a helper/overlay canvas.
  const index = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')];
    let best = 0;
    let bestArea = -1;
    canvases.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (r.width * r.height > bestArea) {
        bestArea = r.width * r.height;
        best = i;
      }
    });
    return best;
  });

  const png = await page.locator('canvas').nth(index).screenshot();

  // Downscale to a small RGB raster; ffmpeg reads the PNG from stdin.
  const W = 120;
  const H = 80;
  const raw = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', 'pipe:0', '-vf', `scale=${W}:${H}`, '-pix_fmt', 'rgb24',
     '-f', 'rawvideo', 'pipe:1'],
    { input: png, maxBuffer: 16 * 1024 * 1024 },
  );

  const seen = new Set<string>();
  let nonBlank = 0;
  for (let i = 0; i + 2 < raw.length; i += 3) {
    const [r, g, b] = [raw[i], raw[i + 1], raw[i + 2]];
    seen.add(`${r >> 4},${g >> 4},${b >> 4}`);
    if (!(r < 12 && g < 12 && b < 12) && !(r > 243 && g > 243 && b > 243)) nonBlank += 1;
  }

  const stats = { pixels: W * H, nonBlank, distinct: seen.size };
  expect(
    nonBlank,
    `${label}: canvas is blank/black — the scene did not render (${JSON.stringify(stats)})`,
  ).toBeGreaterThan(200);
  expect(
    seen.size,
    `${label}: canvas is a flat fill, not an image (${JSON.stringify(stats)})`,
  ).toBeGreaterThan(3);
}

export interface VideoInfo {
  src: string;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  rectW: number;
  rectH: number;
  ratio: number;
  inViewport: boolean;
  hidden: boolean;
}

export interface VideoState {
  /** Every <video> in the DOM, including ones in the inactive responsive layout. */
  total: number;
  /** Only the ones actually rendered — these are what a user can see. */
  visible: VideoInfo[];
  /** The largest visible video: the player, as opposed to a thumbnail. */
  primary: VideoInfo | null;
}

/**
 * Rule 26: readyState and videoWidth alone let a player collapsed to a 40 px
 * controls bar pass every time. Layout has to be asserted too — real height,
 * a sane aspect ratio, on screen, and not hidden.
 */
export async function readVideoState(page: Page): Promise<VideoState> {
  return page.evaluate(() => {
    const videos = [...document.querySelectorAll('video')];

    const info = videos.map((v) => {
      const r = v.getBoundingClientRect();
      const style = getComputedStyle(v);
      return {
        src: v.currentSrc || v.src,
        readyState: v.readyState,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        rectW: Math.round(r.width),
        rectH: Math.round(r.height),
        ratio: r.height > 0 ? r.width / r.height : 0,
        inViewport:
          r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth,
        hidden:
          style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0,
        // These pages ship two responsive layouts (`hidden lg:flex` next to
        // `flex lg:hidden`), so half the <video> tags always sit inside a
        // display:none ancestor. offsetParent is null for those. Excluding them
        // is not softening the check — they are genuinely not on screen, and the
        // collapsed-bar assertion below still runs against everything visible.
        rendered: v.offsetParent !== null && r.width > 0 && r.height > 0,
      };
    });

    const visible = info.filter((v) => v.rendered && !v.hidden).map(({ ...rest }) => rest);
    const primary = [...visible].sort((a, b) => b.rectW * b.rectH - a.rectW * a.rectH)[0] ?? null;
    return { total: videos.length, visible, primary };
  });
}

export async function assertVideoLayout(page: Page, label: string): Promise<void> {
  const state = await readVideoState(page);
  expect(state.total, `${label}: no <video> element on the page`).toBeGreaterThan(0);
  expect(
    state.visible.length,
    `${label}: ${state.total} <video> element(s) exist but none is rendered`,
  ).toBeGreaterThan(0);

  // The failure this rule exists for: a player that collapsed to its controls
  // bar. Its signature is wide-but-almost-no-height, and it must be caught on
  // EVERY visible video, not just the biggest — otherwise a broken player
  // hiding behind a working one passes.
  for (const v of state.visible) {
    const collapsed = v.rectW > 320 && v.rectH < 60;
    expect(
      collapsed,
      `${label}: a video is ${v.rectW}x${v.rectH} — collapsed to a controls bar (${v.src})`,
    ).toBe(false);
    expect(
      v.ratio,
      `${label}: a video box is ${v.rectW}x${v.rectH}, ratio ${v.ratio.toFixed(2)} — stretched into a bar`,
    ).toBeLessThan(6);
  }

  // The main player itself must be a real, on-screen box.
  const p = state.primary!;
  expect(p.rectH, `${label}: the largest video is only ${p.rectH}px tall`).toBeGreaterThan(160);
  expect(p.rectW, `${label}: the largest video is only ${p.rectW}px wide`).toBeGreaterThan(320);
  expect(p.inViewport, `${label}: the main video is off screen`).toBe(true);
  expect(
    p.ratio,
    `${label}: main video box aspect ratio is ${p.ratio.toFixed(2)}`,
  ).toBeGreaterThan(0.9);
  expect(p.ratio, `${label}: main video box aspect ratio is ${p.ratio.toFixed(2)}`).toBeLessThan(3.2);
}

export async function clearEverything(context: BrowserContext, page: Page): Promise<void> {
  await page.goto('/');
  // Wait for the app to actually boot before doing anything else.
  //
  // `goto` resolves on `load`, which is before React has mounted. Returning
  // then meant the caller's next navigation — a fragment-only one, e.g.
  // goto('/#/') — landed while the main bundle was still being evaluated. On
  // WebKit that interrupts the load and the page stays permanently blank: the
  // auth-gate suite then failed with "home (/) should redirect" against an
  // empty #root, which reads as a broken auth gate rather than a race in the
  // reset helper. Chromium happened to survive the same sequence.
  await page
    .waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0, null, {
      timeout: 15_000,
    })
    .catch(() => {
      /* nothing rendered — leave it to the assertions in the test to say so */
    });
  await page.evaluate(async () => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    if ('caches' in window) {
      for (const name of await caches.keys()) await caches.delete(name);
    }
    if ('serviceWorker' in navigator) {
      for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
    }
  });
  await context.clearCookies();
}
