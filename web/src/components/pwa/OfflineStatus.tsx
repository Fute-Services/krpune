import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';

/**
 * What is left of the offline surface: the update bar, and nothing else.
 *
 * There used to be a status pill in the bottom-right corner with a panel behind
 * it — progress, failed files, a retry button, the storage-persistence note.
 * It was removed on purpose. This is a sales-floor kiosk: a visitor looking at a
 * brochure was being shown "Offline · incomplete" in the corner, which reads as
 * "this app is broken" and is about a cache they neither know nor care about.
 * That corner now belongs to the project guide.
 *
 * Nothing about the download itself changed. It is started by
 * offlineBootstrap.ts on sign-in, not by this component, and it still retries,
 * still records failures, and still publishes progress — window.__krcOffline()
 * reads it, which is how the offline test suite checks the library actually
 * landed. If a file genuinely cannot be saved it is now a silent failure at the
 * kiosk, so the test suite is the thing that has to catch it.
 *
 * Two bars stay, and only two:
 *
 *   update      — about the app the visitor is looking at right now. A stale
 *                 worker otherwise serves an old build and gets reported as
 *                 "your fix did not work".
 *   insecure /  — the deployment itself is wrong. On a plain http://192.168.x.x
 *   unsupported   LAN address no worker registers and not one byte is ever
 *                 cached, and the failure is completely silent (rule 24). The
 *                 pill used to be the only thing that said so; deleting it
 *                 outright would have meant a kiosk shipping in a state where
 *                 offline can never work and nothing anywhere says why.
 *
 * A per-file failure deliberately does NOT get a bar. That was the old
 * "Offline · incomplete", and it is the one a visitor must never be shown — the
 * offline test suite is what catches it now.
 */
export default function OfflineStatus() {
  const { progress, sw, applyUpdate } = useOfflineDownload();
  const [dismissed, setDismissed] = useState(false);

  const broken = progress.status === 'insecure' || progress.status === 'unsupported';

  return (
    <AnimatePresence>
      {broken && progress.message && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[2000] flex items-start justify-center gap-3 px-4 py-2.5 bg-amber-500 text-black text-sm shadow-lg"
        >
          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
          <span className="max-w-3xl">{progress.message}</span>
        </motion.div>
      )}

      {sw.updateAvailable && !dismissed && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[2000] flex items-center justify-center gap-3 px-4 py-2.5 bg-[#1C6CBC] text-white text-sm shadow-lg"
        >
          <RefreshCw size={15} />
          <span>A newer version of the app is available.</span>
          <button
            onClick={() => void applyUpdate()}
            className="rounded-md bg-white/20 hover:bg-white/30 px-3 py-1 font-medium transition-colors"
          >
            Reload now
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="p-1 opacity-70 hover:opacity-100"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
