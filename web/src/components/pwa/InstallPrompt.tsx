/**
 * The install affordance the client actually sees.
 *
 * The same buttons already exist inside the OfflineStatus panel, but that panel
 * is behind a collapsed pill in the corner — in practice nobody opens it, so the
 * app reads as "a website that never offered to install". This surfaces the
 * choice on its own, once, right after sign-in.
 *
 * Split by platform because the platforms genuinely differ (rule 20):
 *   Android / desktop Chromium → real `beforeinstallprompt`, so a real button.
 *   iOS / iPadOS               → WebKit has no install API in *any* browser.
 *                                Share → Add to Home Screen is the only route,
 *                                so we show the steps rather than a dead button.
 *   Chromium, prompt not fired → the browser menu still works; say so instead
 *                                of showing nothing.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Share, Smartphone, X, MonitorDown, Plus } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const DISMISS_KEY = 'krc.install.dismissed';

/** Never let a disabled/full localStorage crash the shell. */
function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* ignore — worst case the card offers again next launch */
  }
}

export default function InstallPrompt() {
  const { canPrompt, isIos, isStandalone, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [visible, setVisible] = useState(false);

  // Hold off briefly so the card animates in over a settled page rather than
  // competing with the route transition on first paint.
  useEffect(() => {
    if (isStandalone || dismissed) return;
    const timer = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(timer);
  }, [isStandalone, dismissed]);

  // Already running from the Home Screen — there is nothing left to install.
  if (isStandalone) return null;

  const close = () => {
    setVisible(false);
    setDismissed(true);
    writeDismissed();
  };

  const onInstall = async () => {
    const outcome = await promptInstall();
    // Only stop asking if they actually installed. A dismissed browser dialog
    // should not silently burn the one chance we take to offer this.
    if (outcome === 'accepted') close();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          // bottom-[4.5rem] clears the offline pill (h-10 at bottom-5) so the
          // two never overlap on a narrow window.
          className="
            fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-[1950]
            w-[min(560px,calc(100vw-2.5rem))]
            rounded-2xl overflow-hidden
            bg-[#062442]/95 backdrop-blur-xl border border-white/15
            shadow-[0_16px_48px_rgba(0,0,0,0.55)]
            text-white
          "
          role="dialog"
          aria-label="Install this app"
        >
          <div className="flex items-start gap-4 p-5">
            <img
              src="/icons/pwa-192.png"
              alt=""
              className="w-12 h-12 rounded-xl shrink-0 shadow-lg"
            />

            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold leading-tight">
                Install KRC Pune on this device
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                Opens full screen from your Home Screen, with no address bar, and keeps working
                without a network connection.
              </p>

              {/* Android + desktop Chromium: the real thing. */}
              {canPrompt && (
                <button
                  onClick={() => void onInstall()}
                  className="mt-4 h-11 w-full rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#1C6CBC,#3b82f6)' }}
                >
                  <Smartphone size={17} />
                  Install app
                </button>
              )}

              {/* iOS / iPadOS: no install API exists, so show the actual taps.
                  The "scroll past the app icons" note matters — Add to Home
                  Screen sits below the share sheet's icon row and gets missed. */}
              {!canPrompt && isIos && (
                <ol className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-white/70">
                  <li className="flex gap-2.5">
                    <Share size={15} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Tap the <strong className="text-white">Share</strong> button in Safari&rsquo;s
                      toolbar.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <Plus size={15} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Scroll <strong className="text-white">past the row of app icons</strong> and
                      choose <strong className="text-white">Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <Smartphone size={15} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Open it from the Home Screen and sign in there once — Safari and the installed
                      app keep separate storage, so the offline download has to finish inside the
                      app.
                    </span>
                  </li>
                </ol>
              )}

              {/* Chromium that has not fired the event yet (or a browser that
                  never will). The menu route still works. */}
              {!canPrompt && !isIos && (
                <div className="mt-4 flex gap-2.5 text-[12px] leading-relaxed text-white/70">
                  <MonitorDown size={15} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                  <span>
                    Open your browser menu and choose{' '}
                    <strong className="text-white">Install app</strong> (Chrome and Edge show an
                    install icon in the address bar). If it is not there yet, reload once — the
                    option appears after the app has finished registering.
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={close}
              aria-label="Not now"
              className="p-1 -m-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
