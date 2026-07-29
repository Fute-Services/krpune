/**
 * Client-side session gate.
 *
 * There is no backend: credentials are hardcoded and the "session" is just a
 * localStorage flag. This gates *download and install*, not secret data —
 * anyone can read these constants out of the bundle. Its job is to stop a
 * logged-out visitor from pulling ~500 MB of media onto their device and from
 * installing the app, not to protect the content itself.
 *
 * Deliberately reactive: `startOfflineDownload()` and the install prompt must
 * turn on the moment the user signs in, without a reload, and must turn off in
 * every other tab when the user signs out. Hence onAuthChange() + the `storage`
 * event, rather than a plain read-on-mount.
 */

const VALID_EMAIL = 'cignus@gmail.com';
const VALID_PASSWORD = 'cignus123';

const STORAGE_KEY = 'krc.auth.session';

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
    return { email: parsed.email, signedInAt: Number(parsed.signedInAt) || 0 };
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (!hydrated) {
    memorySession = parse(safeRead());
    hydrated = true;
  }
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
  return session;
}

export function signOut(): void {
  safeWrite(null);
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
    if (changed) emit(next);
  });
}
