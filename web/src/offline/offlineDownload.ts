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

/** Must match the runtimeCaching cacheName in vite.config.ts, or the service
 *  worker and this module would write to two different caches and the
 *  "already downloaded" check would always miss. */
export const MEDIA_CACHE = 'krc-offline-media';

export type OfflineStatus = 'idle' | 'unsupported' | 'insecure' | 'running' | 'complete' | 'error';

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
async function downloadInto(cache: Cache, url: string): Promise<void> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await cache.put(url, response);
}

async function alreadyCached(cache: Cache, url: string): Promise<boolean> {
  return (await cache.match(url, { ignoreVary: true })) !== undefined;
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

  running = (async () => {
    update({ status: 'running', failed: [], message: undefined });

    const persisted = await requestPersistentStorage();
    update({ persisted });

    const cache = await caches.open(MEDIA_CACHE);

    let filesDone = 0;
    let bytesDone = 0;
    const failed: string[] = [];

    // Count what is already there first, so a resumed download shows a real
    // starting point instead of jumping from 0 %.
    const pending: typeof files = [];
    for (const file of files) {
      if (await alreadyCached(cache, file.url)) {
        filesDone += 1;
        bytesDone += file.bytes;
      } else {
        pending.push(file);
      }
    }
    update({ filesDone, bytesDone });

    // Modest concurrency: enough to keep the pipe full, low enough that a
    // tablet on hotel WiFi does not time out four 100 MB videos at once.
    const CONCURRENCY = 3;
    const queue = [...pending];

    async function worker(): Promise<void> {
      for (;;) {
        const file = queue.shift();
        if (!file) return;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await downloadInto(cache, file.url);
            // Credited from the manifest, not from the wire, so the bar lands
            // exactly on 100 % regardless of transfer encoding.
            filesDone += 1;
            bytesDone += file.bytes;
            update({ filesDone, bytesDone });
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          }
        }
        if (lastError) {
          failed.push(file.url);
          update({ failed: [...failed] });
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    update({
      status: failed.length ? 'error' : 'complete',
      message: failed.length
        ? `${failed.length} file(s) could not be saved. Reconnect and retry.`
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
