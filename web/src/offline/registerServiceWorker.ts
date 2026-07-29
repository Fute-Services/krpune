/**
 * Service worker registration — deliberately NOT called at module load.
 *
 * `main.tsx` never touches this. It is invoked only from the authenticated
 * bootstrap path, so a logged-out visitor never installs a worker and never
 * caches the shell.
 *
 * Rule 13: assume users are running a stale worker. Check for updates on
 * launch, on an interval, and whenever the tab comes back to the foreground —
 * a kiosk tablet can sit open for days without ever firing a page load.
 */
import { registerSW } from 'virtual:pwa-register';

let started = false;
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // hourly

export interface SwState {
  registered: boolean;
  updateAvailable: boolean;
}

let state: SwState = { registered: false, updateAvailable: false };
const listeners = new Set<(s: SwState) => void>();

export function getSwState(): SwState {
  return state;
}

export function onSwState(listener: (s: SwState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(patch: Partial<SwState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function registerServiceWorkerOnce(): void {
  if (started) return;
  if (!('serviceWorker' in navigator)) return;
  // No point registering on http:// — it silently does nothing.
  if (!window.isSecureContext) return;
  started = true;

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      set({ updateAvailable: true });
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      set({ registered: true });

      const check = () => {
        // `update()` is a no-op when offline; failure here is expected and must
        // not surface as an error to the user.
        registration.update().catch(() => {});
      };

      check(); // on launch
      window.setInterval(check, UPDATE_INTERVAL_MS); // on interval
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check(); // on foreground
      });
    },
  });
}

/** Activates a waiting worker and reloads. Wired to the "Update available" bar. */
export async function applyUpdate(): Promise<void> {
  if (updateSW) await updateSW(true);
  else window.location.reload();
}
