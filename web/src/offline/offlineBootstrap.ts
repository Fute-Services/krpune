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
 *
 * The worker and the download are deliberately two separate decisions. On iOS
 * in a Safari tab we still want the shell cached — the Home Screen icon has to
 * have something to launch — but the ~450 MB library must wait until the app is
 * running standalone, because the tab and the installed app do not share
 * storage. startOfflineDownload() enforces that itself (awaitingInstallProblem),
 * so this file just calls it and lets it decide.
 */
import { isAuthenticated, onAuthChange } from '@/lib/auth';
import { registerServiceWorkerOnce } from './registerServiceWorker';
import { startOfflineDownload } from './offlineDownload';

let installed = false;

function activateForAuthenticatedUser(): void {
  registerServiceWorkerOnce();
  // Fire and forget: progress is observable through onOfflineProgress().
  // No-ops into 'awaiting-install' on iOS until the app is on the Home Screen.
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
