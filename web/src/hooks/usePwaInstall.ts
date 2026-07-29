import { useCallback, useEffect, useState } from 'react';

/**
 * Install affordances, split honestly by platform.
 *
 * iOS/iPadOS has no `beforeinstallprompt` — and every third-party browser there
 * is WebKit underneath, so no website on any iOS browser can show a working
 * install button (rule 20). The only route is Share → Add to Home Screen, which
 * sits *below* the app-icon row in the share sheet, so users scroll past it.
 * We therefore expose `canPrompt` (a real button) and `isIos` (a hint) as two
 * different things, and never render a button that cannot work.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(detectStandalone);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return {
    canPrompt: deferred !== null,
    isIos: detectIos(),
    isStandalone,
    promptInstall,
  };
}
