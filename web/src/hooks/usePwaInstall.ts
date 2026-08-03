import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  getInstallPromptState,
  promptInstall,
  subscribeInstallPrompt,
} from '@/offline/installPromptStore';

/**
 * Install affordances, split honestly by platform.
 *
 * iOS/iPadOS has no `beforeinstallprompt` — and every third-party browser there
 * is WebKit underneath, so no website on any iOS browser can show a working
 * install button (rule 20). The only route is Share → Add to Home Screen, which
 * sits *below* the app-icon row in the share sheet, so users scroll past it.
 * We therefore expose `canPrompt` (a real button) and `isIos` (a hint) as two
 * different things, and never render a button that cannot work.
 *
 * The `beforeinstallprompt` event itself is not owned here. It fires once, on
 * Chrome's schedule, usually before this hook's first consumer has mounted —
 * installPromptStore listens from page load and parks it, and this hook just
 * subscribes. Attaching the listener in an effect here is what made the real
 * install button so rarely appear.
 */

export function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports a desktop Mac UA; touch points are the giveaway.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

export function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Non-standard Safari flag, still the only reliable iOS signal.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall(): {
  canPrompt: boolean;
  isIos: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
} {
  const { deferred, installed } = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptState,
    getInstallPromptState,
  );

  const [displayStandalone, setDisplayStandalone] = useState(detectStandalone);

  // A desktop Chromium window can switch to standalone without a reload, and a
  // visitor who installs from the browser menu never touches our button — so
  // the card has to notice on its own rather than sitting there for good.
  useEffect(() => {
    const query = window.matchMedia?.('(display-mode: standalone)');
    if (!query) return;
    const onChange = () => setDisplayStandalone(detectStandalone());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return {
    canPrompt: deferred !== null,
    isIos: detectIos(),
    // `installed` covers the window that stays a tab after installing, where
    // the display-mode query never flips but there is nothing left to offer.
    isStandalone: displayStandalone || installed,
    promptInstall,
  };
}
