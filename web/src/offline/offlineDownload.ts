/**
 * Runtime download of the large media library, gated behind login.
 *
 * Nothing here runs at startup. The service worker is not registered and not a
 * single byte of media is fetched until `startOfflineDownload()` is called, and
 * that only happens for an authenticated user. A logged-out visitor gets the
 * login page off the network and leaves no cache behind.
 *
 * Why runtime rather than precache: precache install is all-or-nothing, so one
 * failed entry out of 111 would mean *nothing* cached (rule 10). Here each file
 * is independent, retried, and reported.
 */
import mediaManifest from './mediaManifest.json';
import { isAuthenticated } from '@/lib/auth';
import { detectIos, detectStandalone } from '@/hooks/usePwaInstall';

/** Must match the runtimeCaching cacheName in vite.config.ts, or the service
 *  worker and this module would write to two different caches and the
 *  "already downloaded" check would always miss. */
export const MEDIA_CACHE = 'krc-offline-media';

/**
 * Marker that takes the downloader's own fetches *past* the service worker.
 * Must match the exclusion in the /media/ route in vite.config.ts.
 *
 * `clientsClaim: true` means the worker controls this page, so without the
 * marker every request below is routed through the worker's CacheFirst handler
 * — which fetches the file, streams one branch of it to us and writes the other
 * into the very same cache we are writing to. Two consumers of one 100 MB body,
 * two writers of one entry: the videos pulled twice over the wire and died as a
 * bare "Failed to fetch" with nothing on the page able to explain why. The small
 * files fit through it; the two big ones never did.
 *
 * Only the request carries the marker. `cache.put()` below is given the clean
 * URL as its key, which is what <video> and <img> ask for on playback.
 */
const SW_BYPASS = 'krc-direct';

function directUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}${SW_BYPASS}=1`;
}

export type OfflineStatus =
  | 'idle'
  /** iOS, in a Safari tab. See awaitingInstallProblem(). */
  | 'awaiting-install'
  | 'unsupported'
  | 'insecure'
  | 'running'
  | 'complete'
  | 'error';

export interface OfflineProgress {
  status: OfflineStatus;
  /** Files confirmed present in the cache. */
  filesDone: number;
  filesTotal: number;
  bytesDone: number;
  bytesTotal: number;
  /** URLs that failed after retries — surfaced in the UI, never swallowed. */
  failed: string[];
  persisted: boolean | null;
  message?: string;
}

const files: { url: string; bytes: number }[] = mediaManifest.files;

let progress: OfflineProgress = {
  status: 'idle',
  filesDone: 0,
  filesTotal: files.length,
  bytesDone: 0,
  bytesTotal: mediaManifest.totalBytes,
  failed: [],
  persisted: null,
};

const listeners = new Set<(p: OfflineProgress) => void>();

export function getOfflineProgress(): OfflineProgress {
  return progress;
}

/**
 * The download has no visitor-facing UI any more — the status pill was removed
 * from the corner because a kiosk should not show a sales visitor a warning
 * about its own cache. The progress is still real and still matters, so it is
 * published here for the offline test suite, which used to read the pill's text
 * to know when the library had finished landing. Without this the suite falls
 * back to "the cache entry count stopped growing", which mistakes a 100 MB
 * video being written for a finished download.
 */
declare global {
  interface Window {
    __krcOffline?: () => OfflineProgress;
  }
}
if (typeof window !== 'undefined') window.__krcOffline = getOfflineProgress;

export function onOfflineProgress(listener: (p: OfflineProgress) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<OfflineProgress>): void {
  // New object every time — useSyncExternalStore compares by reference.
  progress = { ...progress, ...patch };
  listeners.forEach((l) => l(progress));
}

/**
 * Service workers require a secure context. On a plain http://192.168.x.x LAN
 * address nothing registers and nothing caches — and the failure is completely
 * silent, so we say it out loud (rule 24).
 */
export function secureContextProblem(): string | null {
  if (typeof window === 'undefined') return null;
  if (window.isSecureContext) return null;
  return `This page is served over plain http (${window.location.host}). Service workers need HTTPS or localhost, so nothing can be saved for offline use here. Open the https:// address instead.`;
}

/**
 * On iOS a Home Screen web app gets its own storage bucket, completely separate
 * from the Safari tab it was installed from. Downloading the library in the tab
 * therefore buys the installed app nothing — the visitor pulls ~450 MB, adds the
 * app, opens it, and is asked to pull the same ~450 MB again.
 *
 * So on iOS we do not start until we are running standalone. The service worker
 * still registers in the tab (the shell has to be cached for the Home Screen
 * icon to have something to launch); only the media download waits.
 *
 * Android and desktop are unaffected: there the installed app and the browser
 * share one storage bucket, so a download started in the tab carries over.
 */
export function awaitingInstallProblem(): string | null {
  if (!detectIos() || detectStandalone()) return null;
  return 'On iPad and iPhone the installed app has its own storage, so anything saved here would not carry over. Add this to your Home Screen first, then open it and sign in — the download starts there.';
}

/**
 * Ask the browser not to evict this origin. Chrome/Edge honour it; Safari
 * ignores it entirely and always resolves false, so on iOS/iPadOS there is no
 * way to protect cached data from eviction. We report the real answer rather
 * than claiming the data is safe (rules 12 and 22).
 */
async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/**
 * Refuse to start a ~450 MB download onto a device that cannot hold it.
 *
 * Without this the download runs for twenty minutes, dies partway with
 * QuotaExceededError, and reports only "N file(s) could not be saved" — so the
 * operator retries, and it fails at the same place every time. Naming the
 * shortfall up front is the difference between "this is broken" and "free up
 * 300 MB on this iPad".
 *
 * Returns null when the browser will not say (Safari under-reports and
 * sometimes omits `estimate` altogether). An unknown quota is not a reason to
 * block — it is a reason to try and let the per-file errors speak.
 */
async function quotaProblem(): Promise<string | null> {
  if (!navigator.storage?.estimate) return null;
  let quota: number | undefined;
  let usage: number | undefined;
  try {
    ({ quota, usage } = await navigator.storage.estimate());
  } catch {
    return null;
  }
  if (!quota) return null;

  // 15 % headroom: the precached shell also lives in this bucket, and browsers
  // start evicting before the quota is literally exhausted.
  const needed = mediaManifest.totalBytes * 1.15;
  const free = quota - (usage ?? 0);
  if (free >= needed) return null;

  const mb = (n: number) => Math.round(n / 1024 / 1024);
  return `This device has about ${mb(free)} MB of storage available for this app, and the offline library needs roughly ${mb(needed)} MB. Free up space and try again.`;
}

/**
 * Reject a response that is drastically smaller than the manifest says it
 * should be, *before* it is written to the cache.
 *
 * This exists because of a real failure that nothing else caught: the three
 * videos under media/videos are tracked in Git LFS, Vercel's Git integration
 * does not fetch LFS objects, and production served the 134-byte pointer text
 * with `HTTP 200` and `Content-Type: video/mp4`. `response.ok` was true, so the
 * pointer was cached as a success and the bar still landed on 100 % —
 * "Available offline" while three pages played nothing. A size check is the
 * only thing that can tell those two cases apart.
 *
 * Deliberately generous (half the expected size), and skipped entirely when the
 * body arrived compressed or without a Content-Length: the goal is to catch a
 * file that is not there at all, not to police byte-exact transfers.
 */
function sizeProblem(response: Response, expectedBytes: number): string | null {
  // Content-Length would be the *encoded* length — comparing it against the
  // on-disk size would fail every brotli'd JSON for no reason.
  if (response.headers.get('content-encoding')) return null;

  const header = response.headers.get('content-length');
  if (header === null) return null; // chunked — nothing to compare against
  const received = Number(header);
  if (!Number.isFinite(received) || expectedBytes <= 0) return null;
  if (received >= expectedBytes * 0.5) return null;

  return `expected ~${expectedBytes} bytes, got ${received}`;
}

/**
 * Fetches a file and writes it into the cache *explicitly*.
 *
 * The obvious implementation — fetch and let the worker's CacheFirst route do
 * the caching — silently does nothing on the very first visit. A newly
 * installed worker does not control the page that registered it until the next
 * navigation, so every one of these requests goes straight past it. The
 * symptom is brutal: the progress bar reaches 98 %, ~500 MB really is pulled
 * over the wire, and the media cache is still empty. Everything works until the
 * network is cut.
 *
 * Writing to the cache here removes the dependency on controller state
 * entirely. The worker's route still matters for *playback* — it is what turns
 * these full responses into the 206s that <video> seeking needs.
 *
 * `cache.put` consumes the response body as a stream, so a 100 MB video is
 * never held in memory. That costs byte-level progress within a single file,
 * which is why progress is credited per file instead.
 */
async function downloadInto(
  cache: Cache,
  url: string,
  expectedBytes: number,
  buffered: boolean,
): Promise<void> {
  const response = await fetch(directUrl(url), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const problem = sizeProblem(response, expectedBytes);
  if (problem) {
    // A body this small is safe to read in full, and quoting it turns "a file
    // failed" into "this is a Git LFS pointer" at a glance.
    let detail = '';
    const received = Number(response.headers.get('content-length'));
    if (received > 0 && received < 1024) {
      const text = await response.clone().text();
      detail = ` — body begins: ${JSON.stringify(text.slice(0, 60))}`;
    }
    throw new Error(`${url}: ${problem}${detail}`);
  }

  if (!buffered) {
    await cache.put(url, response);
    return;
  }

  // Retry path for the two large videos. Streaming straight into `cache.put`
  // hands the still-open connection to the cache, so any stall or drop while
  // those 100 MB / 64 MB bodies are in flight surfaces as the useless
  // "Cache.put() encountered a network error" — the body is gone by then and
  // there is nothing left to retry from. Reading the body to a Blob first means
  // a broken transfer fails as a plain fetch error (retryable), and only a body
  // we already hold in full is ever written. Costs memory, so it is the
  // fallback rather than the default.
  const blob = await response.blob();
  if (expectedBytes > 0 && blob.size < expectedBytes * 0.5) {
    throw new Error(`${url}: truncated transfer — expected ~${expectedBytes} bytes, got ${blob.size}`);
  }
  await cache.put(
    url,
    new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
        'Content-Length': String(blob.size),
      },
    }),
  );
}

/**
 * Size-checked too, so a device that cached a truncated file before this check
 * existed re-downloads it instead of counting it as done forever.
 */
async function alreadyCached(cache: Cache, url: string, expectedBytes: number): Promise<boolean> {
  const hit = await cache.match(url, { ignoreVary: true });
  if (!hit) return false;
  if (sizeProblem(hit, expectedBytes)) {
    await cache.delete(url, { ignoreVary: true });
    return false;
  }
  return true;
}

let running: Promise<OfflineProgress> | null = null;

/**
 * Idempotent. Safe to call on every auth change and on every mount; a second
 * call while a download is in flight joins the existing run instead of starting
 * a parallel one.
 */
export async function startOfflineDownload(): Promise<OfflineProgress> {
  if (running) return running;
  if (!isAuthenticated()) {
    update({ status: 'idle', message: 'Sign in to download the offline library.' });
    return progress;
  }

  const insecure = secureContextProblem();
  if (insecure) {
    update({ status: 'insecure', message: insecure });
    return progress;
  }
  if (!('caches' in window) || !('serviceWorker' in navigator)) {
    update({ status: 'unsupported', message: 'This browser cannot store the app for offline use.' });
    return progress;
  }

  const awaitingInstall = awaitingInstallProblem();
  if (awaitingInstall) {
    update({ status: 'awaiting-install', message: awaitingInstall });
    return progress;
  }

  running = (async () => {
    update({ status: 'running', failed: [], message: undefined });

    const persisted = await requestPersistentStorage();
    update({ persisted });

    const tooSmall = await quotaProblem();
    if (tooSmall) {
      update({ status: 'error', message: tooSmall });
      return progress;
    }

    const cache = await caches.open(MEDIA_CACHE);

    let filesDone = 0;
    let bytesDone = 0;
    const failed: string[] = [];
    let firstError = '';

    // Count what is already there first, so a resumed download shows a real
    // starting point instead of jumping from 0 %.
    const pending: typeof files = [];
    for (const file of files) {
      if (await alreadyCached(cache, file.url, file.bytes)) {
        filesDone += 1;
        bytesDone += file.bytes;
      } else {
        pending.push(file);
      }
    }
    update({ filesDone, bytesDone });

    // Anything past this is a video, and two of those in flight next to a third
    // download is what starves them into a mid-stream abort.
    const LARGE_BYTES = 25 * 1024 * 1024;

    async function worker(queue: typeof files): Promise<void> {
      for (;;) {
        const file = queue.shift();
        if (!file) return;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            // First attempt streams (no memory cost). If that dies inside
            // cache.put, retry with the body buffered — see downloadInto().
            await downloadInto(cache, file.url, file.bytes, attempt > 0);
            // Credited from the manifest, not from the wire, so the bar lands
            // exactly on 100 % regardless of transfer encoding.
            filesDone += 1;
            bytesDone += file.bytes;
            update({ filesDone, bytesDone });
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            // A half-written entry would otherwise be counted as done by the
            // next run's alreadyCached() check if it happens to be big enough.
            await cache.delete(file.url, { ignoreVary: true }).catch(() => {});
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
        if (lastError) {
          failed.push(file.url);
          // Keep the first real reason. "N files could not be saved" is not
          // actionable on its own — the whole point of the size check is that
          // it can say *why*, and "expected ~104892919 bytes, got 134" is a
          // server-side problem no amount of retrying will fix.
          // Named, because the bare browser text is not. "Failed to fetch" sends
          // an operator hunting through the whole library; "walkthrough.mp4:
          // Failed to fetch" says which 100 MB file the connection gave up on.
          if (!firstError) {
            const reason = String((lastError as Error)?.message ?? lastError);
            const name = file.url.split('/').pop() ?? file.url;
            firstError = reason.includes(name) ? reason : `${name}: ${reason}`;
          }
          update({ failed: [...failed] });
        }
      }
    }

    // Small files three at a time — enough to keep the pipe full, low enough
    // that a tablet on hotel WiFi copes. The videos then go one at a time, with
    // the whole connection to themselves.
    const small = pending.filter((f) => f.bytes < LARGE_BYTES);
    const large = pending.filter((f) => f.bytes >= LARGE_BYTES);

    await Promise.all(Array.from({ length: 3 }, () => worker(small)));
    await worker(large);

    update({
      status: failed.length ? 'error' : 'complete',
      message: failed.length
        ? `${failed.length} file(s) could not be saved. Reconnect and retry. First error: ${firstError}`
        : undefined,
    });
    return progress;
  })();

  try {
    return await running;
  } finally {
    running = null;
  }
}

/** Used by sign-out and by the tests, so a device can be returned to a known state. */
export async function clearOfflineData(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
  update({ status: 'idle', filesDone: 0, bytesDone: 0, failed: [], message: undefined });
}
