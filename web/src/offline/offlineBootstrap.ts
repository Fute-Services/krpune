/**
 * The single place that decides *when* offline capability turns on.
 *
 * Contract:
 *   logged out  → no service worker, no cache, no download, no install prompt
 *   logged in   → register the worker, then pull the media library
 *
 * It subscribes to auth rather than reading it once, so signing in enables
 * everything immediately — no reload — and signing out (in this tab or any
 * other) stops it again.
 */
import { isAuthenticated, onAuthChange } from '@/lib/auth';
import { registerServiceWorkerOnce } from './registerServiceWorker';
import { startOfflineDownload } from './offlineDownload';

let installed = false;

function activateForAuthenticatedUser(): void {
  registerServiceWorkerOnce();
  // Fire and forget: progress is observable through onOfflineProgress().
  void startOfflineDownload();
}

export function installOfflineBootstrap(): void {
  if (installed) return;
  installed = true;

  // Page loaded with a session already in localStorage → start straight away.
  if (isAuthenticated()) activateForAuthenticatedUser();

  onAuthChange((session) => {
    if (session) activateForAuthenticatedUser();
  });
}
