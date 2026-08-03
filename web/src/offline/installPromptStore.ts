/**
 * Holds Chromium's install offer from the moment the page loads.
 *
 * `beforeinstallprompt` fires exactly once, only after Chrome's engagement
 * heuristic is satisfied (an interaction plus roughly 30 seconds on the page),
 * and it is the only way to show a real install button. On this app that
 * threshold is normally crossed while the visitor is still typing on
 * `#/login` — but InstallPrompt lives inside the authenticated shell, so the
 * component that used to own the listener had not mounted yet. Nothing was
 * listening, the event went nowhere, and the card that appeared after sign-in
 * could only offer "open your browser menu". Which is exactly the complaint:
 * it did not behave like an install prompt on any other site.
 *
 * So the listeners are attached from main.tsx before React renders, and the
 * event is parked here until something asks for it.
 *
 * This registers no service worker and writes no cache. A logged-out visitor
 * still leaves nothing behind, which is the contract offlineBootstrap.ts keeps.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallPromptState {
  /** The parked event, or null if the browser has not offered one. */
  deferred: BeforeInstallPromptEvent | null;
  /** `appinstalled` seen in this document — the offer is over, however it ended. */
  installed: boolean;
}

// Rebuilt only when something actually changes, never per read: useSyncExternalStore
// compares snapshots by identity and would loop forever on a fresh object each call.
let state: InstallPromptState = { deferred: null, installed: false };

const listeners = new Set<() => void>();
let listening = false;

function set(next: InstallPromptState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

/**
 * Attach the listeners. Called from main.tsx at startup; safe to call again.
 */
export function captureInstallPrompt(): void {
  if (listening) return;
  if (typeof window === 'undefined') return;
  listening = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    // Without preventDefault Chrome shows its own mini-infobar on some
    // versions and `prompt()` is spent, so our card would offer a button that
    // does nothing.
    event.preventDefault();
    set({ deferred: event as BeforeInstallPromptEvent, installed: false });
  });

  window.addEventListener('appinstalled', () => {
    // The deferred event cannot be re-used after an install, so drop it rather
    // than leaving a button on screen that would resolve 'unavailable'.
    set({ deferred: null, installed: true });
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallPromptState(): InstallPromptState {
  return state;
}

/**
 * Show the browser's install dialog.
 *
 * 'unavailable' means the browser never offered one — iOS always, and Chromium
 * until its engagement threshold is met. Callers must treat that as "explain
 * the manual route", not as a failure.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const { deferred } = state;
  if (!deferred) return 'unavailable';
  // Spent either way: the event cannot be prompted twice.
  set({ deferred: null, installed: state.installed });
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  return outcome;
}
