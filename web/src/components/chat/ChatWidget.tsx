/**
 * The project guide.
 *
 * Styled as a piece of this app rather than as a chat widget: the same glass the
 * Sidebar rail is made of — `linear-gradient(164deg, #105CA847, rgba(6,36,66,0.55))`
 * behind a 14 px blur, a 2 px white-25% edge, a 20 px radius and the highlight
 * sheet across the top third. Anything else reads as a bolted-on plugin next to
 * the rest of the kiosk.
 *
 * Bottom-RIGHT: the offline status pill that used to sit here is gone. Not the
 * left — AboutUs stacks Corporate Profile / Walkthrough / Gallery low on that
 * side and the sidebar rail runs down the edge; a floating control over either
 * swallows their taps, which has happened before (see InstallPrompt).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Mic, Route, Volume2, VolumeX, X } from 'lucide-react';
import { ask, explainError, hasApiKey, type ChatMessage } from '@/chatbot/chatClient';
import { pageFor, PROJECT_NAME } from '@/chatbot/knowledge';
import { useSpeech } from '@/chatbot/useSpeech';
import { DWELL_AFTER_SPEECH_MS, minimumStopMs, TOUR, tourMinutes } from '@/chatbot/tour';
import { VoiceOrb, Waveform } from './VoiceVisuals';

/** Kept short — the brief goes up every turn and the account has a token cap. */
const MAX_HISTORY = 12;

/** The app's glass, lifted from Sidebar so the two cannot drift apart. */
const GLASS = {
  background: 'linear-gradient(164deg, #105CA847 28%, rgba(6,36,66,0.92) 100%)',
  border: '2px solid rgba(255,255,255,0.25)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
} as const;

/** The highlight the rail has across its top third. */
function Sheen({ radius }: { radius: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-2/5"
      style={{
        borderRadius: `${radius}px ${radius}px 0 0`,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
      }}
    />
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState('');
  const [muted, setMuted] = useState(false);
  /** Index of the tour stop being narrated, or null when no tour is running. */
  const [tourStop, setTourStop] = useState<number | null>(null);
  const tourTimer = useRef(0);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const scroller = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  // Read at send time, so a navigation the guide performs mid-answer does not
  // confuse the next turn.
  const here = useRef(pathname);
  here.current = pathname;

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || streaming) return;

      // A question during the tour ends the tour. The visitor has taken over.
      // (stopSpeaking settles the line in flight, which fires the tour's
      // advance callback — harmless, because advancing from null stays null.)
      window.clearTimeout(tourTimer.current);
      setTourStop(null);
      speech.stopSpeaking();

      setDraft('');
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setPartial('');
      setStreaming(true);

      const controller = new AbortController();
      inFlight.current = controller;

      try {
        const reply = await ask({
          history: messages.slice(-MAX_HISTORY),
          question: text,
          pathname: here.current,
          // The whole reply so far, already cleaned — see scrubMeta.
          onText: setPartial,
          onNavigate: (path) => navigate(path),
          onStartTour: () => setTourStop(0),
          signal: controller.signal,
        });
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        if (!muted) speech.speak(reply);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessages((prev) => [...prev, { role: 'assistant', content: explainError(error) }]);
      } finally {
        setPartial('');
        setStreaming(false);
        inFlight.current = null;
      }
    },
    // `speech` is created below and is stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, muted, navigate, streaming],
  );

  const speech = useSpeech(
    useCallback((transcript: string) => void send(transcript), [send]),
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, partial]);

  const endTour = useCallback(() => {
    window.clearTimeout(tourTimer.current);
    setTourStop(null);
    speech.stopSpeaking();
  }, [speech]);

  /**
   * One effect per stop: show the screen, say the line, hold, move on.
   *
   * Advancing on the end of the spoken line rather than on a fixed timer is what
   * makes it feel like a person talking — a short line moves on quickly, a long
   * one is allowed to finish. When the voice is muted there is nothing to wait
   * for, so a plain beat stands in.
   */
  useEffect(() => {
    if (tourStop === null) return;

    const stop = TOUR[tourStop];
    if (!stop) {
      setTourStop(null);
      return;
    }

    navigate(stop.path);
    setMessages((prev) => [...prev, { role: 'assistant', content: stop.line }]);

    const startedAt = Date.now();
    const floor = minimumStopMs(stop.line);

    // Wait for the line to be spoken, then a beat — but never leave a screen
    // sooner than the line takes to say. `advance` can fire immediately when
    // muted, when the voice fails, or on a device with no audio at all, and
    // without the floor the whole tour would flick past in a minute.
    const advance = (): void => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(DWELL_AFTER_SPEECH_MS, floor - elapsed);
      tourTimer.current = window.setTimeout(
        () => setTourStop((current) => (current === null ? null : current + 1)),
        wait,
      );
    };

    if (muted) advance();
    else speech.speak(stop.line, advance);

    return () => window.clearTimeout(tourTimer.current);
    // `speech` is stable for the life of the component; including it would
    // restart the current stop on every speaking-state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStop, muted, navigate]);

  // Nothing should outlive the panel.
  useEffect(() => () => window.clearTimeout(tourTimer.current), []);

  // Closing must silence it. A panel that keeps talking after it is shut reads
  // as a bug, and on a shared screen it talks over the next visitor.
  const close = useCallback(() => {
    setOpen(false);
    window.clearTimeout(tourTimer.current);
    setTourStop(null);
    speech.stopSpeaking();
    speech.stopListening();
    inFlight.current?.abort();
  }, [speech]);

  // Nothing to offer without a key, and a chat box that answers every question
  // with a configuration error is worse than no chat box.
  if (!hasApiKey()) return null;

  const current = pageFor(pathname);
  const suggestions = current
    ? ['What am I looking at?', `More about ${current.title}`, 'Amenities dikhao']
    : ['What is this project?', 'Show me the amenities', 'Location kaisi hai?'];

  const status = tourStop !== null
    ? `Tour — ${pageFor(TOUR[tourStop]?.path ?? '')?.title ?? 'on the way'}`
    : speech.listening
    ? 'Listening…'
    : speech.transcribing
      ? 'One moment…'
      : streaming
        ? 'Thinking…'
        : speech.speaking
          ? 'Speaking…'
          : PROJECT_NAME;

  const busy = speech.listening || speech.transcribing || streaming || speech.speaking;

  return (
    <>
      {/* ── Launcher ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={() => setOpen(true)}
            aria-label="Ask the guide"
            className="group fixed bottom-6 right-6 z-[1900] flex items-center gap-3 h-14 pl-3 pr-5 rounded-full overflow-hidden text-left"
            style={{ ...GLASS, boxShadow: '0 10px 34px rgba(0,0,0,0.45)' }}
          >
            <Sheen radius={28} />
            <VoiceOrb levelRef={speech.levelRef} active={busy} size={44} />
            <span className="relative">
              <span className="block text-[13px] font-semibold text-white leading-tight">
                Ask the guide
              </span>
              <span className="block text-[10px] text-white/55 leading-tight">
                Tap and speak — or type
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            role="dialog"
            aria-label="Project guide"
            className="
              fixed bottom-6 right-6 z-[1900]
              w-[min(24rem,calc(100vw-3rem))] max-h-[min(34rem,calc(100vh-4rem))]
              flex flex-col overflow-hidden text-white
            "
            style={{ ...GLASS, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}
          >
            <Sheen radius={20} />

            {/* Header */}
            <header className="relative flex items-center gap-3 px-4 pt-3.5 pb-3">
              <VoiceOrb levelRef={speech.levelRef} active={busy} size={44} />
              <div className="flex-1 min-w-0">
                <h2 className="text-[13px] font-semibold leading-tight tracking-wide">
                  Project Guide
                </h2>
                <p className="text-[10.5px] text-[#90C7FF]/80 leading-tight truncate">{status}</p>
              </div>
              <button
                onClick={() => {
                  if (!muted) speech.stopSpeaking();
                  setMuted((v) => !v);
                }}
                aria-label={muted ? 'Turn the voice on' : 'Turn the voice off'}
                className="p-1.5 rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors"
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                onClick={close}
                aria-label="Close"
                className="p-1.5 rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </header>

            <div
              aria-hidden
              className="relative h-px mx-4"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.28), transparent)',
              }}
            />

            {/* Tour bar. Only while a tour is running — it is a mode, and a
                visitor being driven around needs a visible way to stop. */}
            <AnimatePresence>
              {tourStop !== null && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-[10.5px] text-[#90C7FF] tabular-nums shrink-0">
                      Tour · {tourStop + 1}/{TOUR.length}
                    </span>
                    <div className="flex-1 h-[3px] rounded-full bg-white/12 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#90C7FF,#1C6CBC)' }}
                        animate={{ width: `${((tourStop + 1) / TOUR.length) * 100}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        window.clearTimeout(tourTimer.current);
                        speech.stopSpeaking();
                        setTourStop((c) => (c === null || c + 1 >= TOUR.length ? null : c + 1));
                      }}
                      className="text-[10.5px] text-white/55 hover:text-white transition-colors shrink-0"
                    >
                      Skip
                    </button>
                    <button
                      onClick={endTour}
                      className="text-[10.5px] text-white/55 hover:text-white transition-colors shrink-0"
                    >
                      Stop
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation */}
            <div ref={scroller} className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && !partial && (
                <div className="space-y-4">
                  <p className="text-[12.5px] leading-relaxed text-white/60">
                    Ask me about {current ? `the ${current.title} screen` : 'the project'}
                    {speech.canListen
                      ? ' — tap the mic and just talk.'
                      : ' — I read my answer out loud.'}
                  </p>
                  {/* The tour is started straight from here rather than by
                      asking the model to call start_tour: it is the thing most
                      visitors want, and a round trip to be told what we already
                      know is a second of silence and a slice of the token cap
                      for nothing. Asking out loud still works. */}
                  <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setTourStop(0)}
                    className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:brightness-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(28,108,188,0.55), rgba(59,130,246,0.35))',
                      border: '1px solid rgba(144,199,255,0.35)',
                    }}
                  >
                    <Route size={15} className="text-[#90C7FF] shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold leading-tight">
                        Take me on the tour
                      </span>
                      <span className="block text-[10px] text-white/55 leading-tight">
                        {TOUR.length} screens, about {tourMinutes()} minutes — stop any time
                      </span>
                    </span>
                  </motion.button>

                  <div className="flex flex-col items-start gap-2">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.06 * i }}
                        onClick={() => void send(s)}
                        className="rounded-full px-3 py-1.5 text-[11.5px] text-white/75 hover:text-white transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.16)',
                        }}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <p
                      className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-[12.5px] leading-relaxed"
                      style={{
                        background: 'linear-gradient(140deg, #1C6CBC 0%, #2563eb 100%)',
                        boxShadow: '0 4px 14px rgba(28,108,188,0.35)',
                      }}
                    >
                      {m.content}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <span
                      aria-hidden
                      className="mt-1 w-[2px] shrink-0 rounded-full self-stretch"
                      style={{ background: 'linear-gradient(#90C7FF, rgba(144,199,255,0.05))' }}
                    />
                    <p className="text-[12.5px] leading-relaxed text-white/85">{m.content}</p>
                  </motion.div>
                ),
              )}

              {partial && (
                <div className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1 w-[2px] shrink-0 rounded-full self-stretch"
                    style={{ background: 'linear-gradient(#90C7FF, rgba(144,199,255,0.05))' }}
                  />
                  <p className="text-[12.5px] leading-relaxed text-white/85">
                    {partial}
                    <motion.span
                      className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle bg-[#90C7FF]"
                      animate={{ opacity: [1, 0.15, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                  </p>
                </div>
              )}

              {streaming && !partial && (
                <div className="flex gap-1.5 pl-1" aria-label="Thinking">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#90C7FF]/70"
                      animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Composer — or the listening state, which replaces it entirely so
                there is exactly one thing on screen to look at while talking. */}
            {/* Fixed height with both states stacked inside it: they crossfade
                rather than replace each other. `mode="wait"` here left a gap
                where the composer had exited and the next state had not yet
                entered — for a few frames the panel had no input row at all,
                which looks like the app losing its own controls. */}
            <div className="relative px-3 pb-3 pt-1 h-[3.5rem] shrink-0">
              <AnimatePresence initial={false}>
                {speech.listening ? (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute inset-x-3 top-1 flex items-center gap-3 h-11 px-4 rounded-full"
                    style={{
                      background: 'rgba(144,199,255,0.10)',
                      border: '1px solid rgba(144,199,255,0.35)',
                    }}
                  >
                    <Waveform levelRef={speech.levelRef} />
                    <span className="flex-1 text-[11px] text-[#90C7FF]">Go ahead, I'm listening</span>
                    <button
                      onClick={speech.stopListening}
                      aria-label="Stop listening"
                      className="text-[11px] text-white/50 hover:text-white transition-colors"
                    >
                      Stop
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="composer"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send(draft);
                    }}
                    className="absolute inset-x-3 top-1 flex items-center gap-2 h-11 pl-1.5 pr-1.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.16)',
                    }}
                  >
                    {speech.canListen && (
                      <button
                        type="button"
                        onClick={speech.startListening}
                        disabled={speech.transcribing}
                        aria-label="Speak"
                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:text-white transition-all disabled:opacity-40"
                        style={{ background: 'rgba(255,255,255,0.10)' }}
                      >
                        <Mic size={14} />
                      </button>
                    )}

                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={speech.transcribing ? 'One moment…' : 'Ask about this screen…'}
                      aria-label="Your question"
                      className="flex-1 min-w-0 bg-transparent text-[12.5px] text-white placeholder:text-white/35 outline-none"
                    />

                    <button
                      type="submit"
                      disabled={!draft.trim() || streaming}
                      aria-label="Send"
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-25"
                      style={{
                        background: 'linear-gradient(140deg, #90C7FF 0%, #1C6CBC 100%)',
                        boxShadow: '0 3px 12px rgba(28,108,188,0.45)',
                      }}
                    >
                      <ArrowUp size={15} className="text-[#05101f]" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
