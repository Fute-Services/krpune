import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Check,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Share,
  X,
  Smartphone,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

/**
 * Offline + install surface. Mounted inside the authenticated layout only, so a
 * logged-out visitor never sees an install button and never sees a download.
 */

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(0);
}

export default function OfflineStatus() {
  const { progress, sw, retry, applyUpdate } = useOfflineDownload();
  const { canPrompt, isIos, isStandalone, promptInstall } = usePwaInstall();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  const pct =
    progress.bytesTotal > 0
      ? Math.min(100, Math.round((progress.bytesDone / progress.bytesTotal) * 100))
      : 0;

  const complete = progress.status === 'complete';
  const running = progress.status === 'running';
  const blocked = progress.status === 'insecure' || progress.status === 'unsupported';

  return (
    <>
      {/* ── Update bar (rule 13). Always paired with cache-clearing instructions,
             because a stale worker otherwise gets reported as "your fix is broken". ── */}
      <AnimatePresence>
        {sw.updateAvailable && !dismissedUpdate && (
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
              onClick={() => setDismissedUpdate(true)}
              aria-label="Dismiss"
              className="p-1 opacity-70 hover:opacity-100"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collapsed pill ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Offline status"
        className="
          fixed bottom-5 right-5 z-[1900]
          flex items-center gap-2 h-10 pl-3 pr-4 rounded-full
          bg-[#062442]/85 backdrop-blur-md border border-white/15
          text-white text-xs font-medium
          shadow-[0_6px_24px_rgba(0,0,0,0.4)]
          hover:bg-[#0a3b6a]/85 transition-colors
        "
      >
        {running && <LoaderCircle size={15} className="animate-spin text-[#90C7FF]" />}
        {complete && <Check size={15} className="text-emerald-400" />}
        {progress.status === 'error' && <CircleAlert size={15} className="text-amber-400" />}
        {blocked && <ShieldAlert size={15} className="text-amber-400" />}
        {progress.status === 'idle' && <Download size={15} className="text-white/70" />}
        <span>
          {running && `Saving offline · ${pct}%`}
          {complete && 'Available offline'}
          {progress.status === 'error' && 'Offline · incomplete'}
          {blocked && 'Offline unavailable'}
          {progress.status === 'idle' && 'Offline'}
        </span>
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="
              fixed bottom-[4.25rem] right-5 z-[1900] w-[min(22rem,calc(100vw-2.5rem))]
              rounded-2xl bg-[#05101f]/95 backdrop-blur-xl border border-white/15
              shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-5 text-white
            "
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">Offline library</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 -m-1 text-white/45 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/55 mb-2">
                <span>
                  {progress.filesDone} / {progress.filesTotal} files
                </span>
                <span>
                  {mb(progress.bytesDone)} / {mb(progress.bytesTotal)} MB
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#1C6CBC,#3b82f6)' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </div>

            {progress.message && (
              <p className="mt-3 text-xs leading-relaxed text-amber-300/90">{progress.message}</p>
            )}

            {progress.failed.length > 0 && (
              <button
                onClick={retry}
                className="mt-3 w-full h-9 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors"
              >
                Retry {progress.failed.length} failed file(s)
              </button>
            )}

            {/* Storage honesty (rules 12 + 22) */}
            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              {progress.persisted === true &&
                'Storage is marked persistent — the browser will not evict this data automatically.'}
              {progress.persisted === false &&
                'This browser declined persistent storage. Cached data can be evicted if the device runs low on space.'}
              {progress.persisted === null &&
                'This browser does not support persistent storage. On iOS and iPadOS in particular there is no way to stop Safari evicting cached data, so a long-unused install may need to re-download.'}
            </p>

            {/* Install affordances (rule 20) */}
            {!isStandalone && (
              <div className="mt-4 pt-4 border-t border-white/10">
                {canPrompt && (
                  <button
                    onClick={() => void promptInstall()}
                    className="w-full h-10 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#1C6CBC,#3b82f6)' }}
                  >
                    <Smartphone size={16} />
                    Install app
                  </button>
                )}

                {/* iOS has no beforeinstallprompt, and every browser on iOS is
                    WebKit underneath — so there is no button we could show that
                    would work. A hint is the only honest option. */}
                {!canPrompt && isIos && (
                  <div className="flex gap-2.5 text-[11px] leading-relaxed text-white/55">
                    <Share size={15} className="mt-0.5 shrink-0 text-[#90C7FF]" />
                    <span>
                      To install on iPad: tap <strong className="text-white/80">Share</strong>, then
                      scroll <strong className="text-white/80">past the app icons</strong> and choose{' '}
                      <strong className="text-white/80">Add to Home Screen</strong>. Open the app
                      from the Home Screen and let it finish downloading there — Safari and the
                      installed app keep separate storage, so anything saved while browsing does not
                      carry over.
                    </span>
                  </div>
                )}

                {!canPrompt && !isIos && (
                  <p className="text-[11px] leading-relaxed text-white/40">
                    Your browser has not offered an install prompt yet. It usually appears after the
                    first full visit, or via the browser menu.
                  </p>
                )}
              </div>
            )}

            {/* Session. Cached media is deliberately left in place on sign-out —
                the next authorised user on this kiosk should not have to
                re-download 500 MB. */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-white/35 truncate">{session?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
