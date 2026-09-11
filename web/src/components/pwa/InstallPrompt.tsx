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
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Share, Smartphone, X, MonitorDown, Plus } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
// Owned by auth.ts because signOut() clears it — a dismissal lasts for that
// visitor's session, not for every visitor after them on a shared device.
import { INSTALL_DISMISSED_KEY as DISMISS_KEY } from '@/lib/auth';

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
  const { pathname } = useLocation();

  // Home only. Signing in lands the visitor here, so the offer is still the
  // first thing they see — and an overlay that exists on exactly one screen
  // cannot sit on top of a control somewhere else. The first version of this
  // card was bottom-anchored on every route and swallowed the taps meant for
  // AboutUs's Corporate Profile button, which looked like a broken brochure.
  const onHome = pathname === '/';

  // Hold off briefly so the card animates in over a settled page rather than
  // competing with the route transition on first paint, then take itself away.
  //
  // It is an offer, not a task: leaving it parked in the corner of a brochure
  // running on a showroom screen is worse than missing it. Auto-hide is state
  // only — nothing is written to localStorage — so the next launch offers it
  // once more, and the offline pill carries the same install button for anyone
  // who wants it back.
  useEffect(() => {
    if (isStandalone || dismissed || !onHome) {
      setVisible(false);
      return;
    }
    const show = window.setTimeout(() => setVisible(true), 1500);
    // Long enough to read the iOS steps, short enough not to sit there.
    const hide = window.setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 13000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [isStandalone, dismissed, onHome]);

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
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          // Top right, which is where a browser's own install offer appears and
          // where this one was asked to be.
          //
          // Never the bottom: that is where the real controls live — the offline
          // pill sits bottom-right and AboutUs stacks Corporate Profile /
          // Walkthrough / Gallery in the same corner. A bottom-anchored card sat
          // on top of them and silently swallowed their taps, which read as "the
          // brochure does not open".
          //
          // top-[5rem] clears the update bar (top-0), the floating Back button
          // and the corner logo. The home page's own icon rail runs down this
          // side underneath, which is why the × is on every platform now — see
          // the dismiss button.
          className="
            fixed top-[5rem] right-3 sm:right-5 z-[1950]
            w-[min(300px,calc(100vw-1.5rem))]
            rounded-2xl overflow-hidden
            bg-[#062442]/95 backdrop-blur-xl border border-white/15
            shadow-[0_16px_48px_rgba(0,0,0,0.55)]
            text-white
          "
          role="dialog"
          aria-label="Install this app"
        >
          <div className="flex items-start gap-3 p-3.5">
            <img
              src="/icons/pwa-192.png"
              alt=""
              className="w-9 h-9 rounded-lg shrink-0 shadow-lg"
            />

            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-semibold leading-tight">Install KRC Pune</h2>
              <p className="mt-1 text-[11px] leading-snug text-white/55">
                Opens full screen and keeps working without a network.
              </p>

              {/* Android + desktop Chromium: the real thing. */}
              {canPrompt && (
                <button
                  onClick={() => void onInstall()}
                  className="mt-3 h-9 w-full rounded-lg font-semibold text-[13px] flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#1C6CBC,#3b82f6)' }}
                >
                  <Smartphone size={15} />
                  Install app
                </button>
              )}

              {/* iOS / iPadOS: no install API exists, so show the actual taps.
                  The "scroll past the app icons" note matters — Add to Home
                  Screen sits below the share sheet's icon row and gets missed. */}
              {!canPrompt && isIos && (
                <ol className="mt-3 space-y-2 text-[11px] leading-snug text-white/70">
                  <li className="flex gap-2">
                    <Share size={14} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Tap <strong className="text-white">Share</strong> in Safari&rsquo;s toolbar.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Plus size={14} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Scroll <strong className="text-white">past the app icons</strong> &rarr;{' '}
                      <strong className="text-white">Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Smartphone size={14} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      Sign in from the Home Screen —{' '}
                      <strong className="text-white">the download starts there</strong>.
                    </span>
                  </li>
                </ol>
              )}

              {/* Chromium that has not fired the event yet (or a browser that
                  never will). The menu route still works. */}
              {!canPrompt && !isIos && (
                <div className="mt-3 flex gap-2 text-[11px] leading-snug text-white/70">
                  <MonitorDown size={14} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                  <span>
                    Use the install icon in the address bar, or your browser menu &rsaquo;{' '}
                    <strong className="text-white">Install app</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* On every platform, including iOS.

                It used to be withheld there, because on iOS the download does
                not start until the app runs from the Home Screen and this card
                is the only thing that says so. But sitting in the top-right
                corner it now covers the home page's icon rail, and a card that
                cannot be closed would keep those buttons unreachable for as long
                as the visitor declines to install. The explanation is not lost:
                the offline pill reports 'awaiting-install' with the same reason,
                and the dismissal only lasts for this visitor's session — the
                next one on a shared tablet is offered it again. */}
            <button
              onClick={close}
              aria-label="Not now"
              className="p-1 -m-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
