/**
 * Client-side session gate.
 *
 * There is no backend: credentials are hardcoded and the "session" is just a
 * localStorage flag that expires 20 minutes after sign-in (SESSION_TTL_MS), so
 * each visitor to the shared device has to sign in for themselves. This gates
 * *download and install*, not secret data —
 * anyone can read these constants out of the bundle. Its job is to stop a
 * logged-out visitor from pulling ~500 MB of media onto their device and from
 * installing the app, not to protect the content itself.
 *
 * Deliberately reactive: `startOfflineDownload()` and the install prompt must
 * turn on the moment the user signs in, without a reload, and must turn off in
 * every other tab when the user signs out. Hence onAuthChange() + the `storage`
 * event, rather than a plain read-on-mount.
 */

const VALID_EMAIL = 'krcpune@gmail.com';
const VALID_PASSWORD = 'krcpune123';

const STORAGE_KEY = 'krc.auth.session';

/**
 * A session lasts 20 minutes from sign-in, then the gate closes again.
 *
 * Absolute, not idle-based: this is a shared experience-centre device, and the
 * point is that the *next* visitor has to sign in rather than walking up to
 * whatever the last one left open. An idle timer would keep a session alive
 * through a whole afternoon of back-to-back visitors.
 */
export const SESSION_TTL_MS = 20 * 60 * 1000;

function isExpired(session: Session): boolean {
  return Date.now() - session.signedInAt >= SESSION_TTL_MS;
}

export interface Session {
  email: string;
  signedInAt: number;
}

type Listener = (session: Session | null) => void;

const listeners = new Set<Listener>();

/**
 * localStorage throws in Safari private mode and when storage is disabled by
 * policy. Never let that crash the app — degrade to "signed out".
 */
function safeRead(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWrite(value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable — the in-memory session below still works for this tab */
  }
}

let memorySession: Session | null = null;
let hydrated = false;

function parse(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed?.email !== 'string') return null;
    const session = { email: parsed.email, signedInAt: Number(parsed.signedInAt) || 0 };
    // A stored session that already aged out must never come back to life —
    // reloading the page would otherwise resurrect it for another 20 minutes.
    if (isExpired(session)) {
      safeWrite(null);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Fires the expiry itself, so a tab sitting open on the tour drops back to the
 * login screen on its own rather than waiting for the next read.
 */
let expiryTimer: number | null = null;

function scheduleExpiry(session: Session | null): void {
  if (typeof window === 'undefined') return;
  if (expiryTimer !== null) {
    window.clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  if (!session) return;

  const remaining = session.signedInAt + SESSION_TTL_MS - Date.now();
  if (remaining <= 0) {
    signOut();
    return;
  }
  expiryTimer = window.setTimeout(() => signOut(), remaining);
}

export function getSession(): Session | null {
  if (!hydrated) {
    memorySession = parse(safeRead());
    hydrated = true;
    scheduleExpiry(memorySession);
  }
  // Read-only on purpose: useSyncExternalStore calls this during render, so it
  // must stay pure and return a stable reference. The timer above (and the
  // visibility check below) do the actual sign-out and notify listeners.
  if (memorySession && isExpired(memorySession)) return null;
  return memorySession;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

function emit(session: Session | null): void {
  memorySession = session;
  hydrated = true;
  listeners.forEach((listener) => listener(session));
}

export class AuthError extends Error {}

/**
 * Async on purpose: the login form shows a spinner, and keeping the signature
 * promise-based means swapping in a real endpoint later changes nothing here.
 */
export async function signIn(email: string, password: string): Promise<Session> {
  // Small delay so the submit spinner is visible rather than flashing.
  await new Promise((resolve) => setTimeout(resolve, 450));

  const normalised = email.trim().toLowerCase();
  if (normalised !== VALID_EMAIL || password !== VALID_PASSWORD) {
    throw new AuthError('Incorrect email or password.');
  }

  const session: Session = { email: normalised, signedInAt: Date.now() };
  safeWrite(JSON.stringify(session));
  emit(session);
  scheduleExpiry(session);
  return session;
}

/**
 * Written by InstallPrompt when the visitor taps ×. Cleared here because this
 * is a shared experience-centre device: without it, the first person to dismiss
 * the install card silences it for every visitor after them, on a device none
 * of them own. A dismissal should last for that visitor's session, not forever.
 */
export const INSTALL_DISMISSED_KEY = 'krc.install.dismissed';

export function signOut(): void {
  if (expiryTimer !== null) {
    window.clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  safeWrite(null);
  try {
    window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
  } catch {
    /* storage unavailable — the flag could not have been written either */
  }
  emit(null);
}

/**
 * Subscribe to session changes. Fires for sign-in/out in *this* tab (via emit)
 * and in other tabs (via the storage event). Returns an unsubscribe function.
 */
export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// `storage` only fires in tabs *other* than the one that wrote, which is
// exactly the cross-tab sync we want — same-tab changes already went via emit().
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    const next = parse(safeRead());
    const changed = (next?.email ?? null) !== (memorySession?.email ?? null);
    if (changed) {
      emit(next);
      scheduleExpiry(next);
    }
  });

  // A background tab — or a tablet that went to sleep — does not run timers on
  // schedule, so the 20 minutes can quietly elapse without the timeout ever
  // firing. Re-check whenever the page comes back to the foreground; without
  // this, a device woken after lunch would still be sitting inside the tour.
  // Re-read storage rather than trusting the in-memory copy: another tab may
  // have signed out, and parse() drops (and clears) a session that aged out.
  const recheck = () => {
    const next = parse(safeRead());
    const changed = (next?.email ?? null) !== (memorySession?.email ?? null);
    if (changed) emit(next);
    // emit() has already updated memorySession; scheduleExpiry signs out on its
    // own if the remaining time is already gone.
    scheduleExpiry(memorySession);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recheck();
  });
  window.addEventListener('focus', recheck);
}
