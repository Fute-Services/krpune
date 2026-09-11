/**
 * The two audio-reactive pieces of the guide.
 *
 * Both are driven by the real waveform — the visitor's microphone while they
 * talk, the ElevenLabs playback while the guide answers (see useSpeech). That is
 * the point: a canned "pulsing dot" animation says nothing, while a ring that
 * actually moves with your voice tells you the kiosk is hearing you, which is
 * the one thing a person standing at a touchscreen needs to know.
 *
 * Neither re-renders. They read a ref inside their own animation frame and write
 * to the DOM, so a panel with a conversation in it is not re-rendering sixty
 * times a second to move a circle.
 */
import { useEffect, useRef } from 'react';

const ACCENT = '#90C7FF';

interface Props {
  levelRef: React.RefObject<number>;
  /** Idle rings sit still; active ones breathe even in silence. */
  active: boolean;
}

/** The head of the panel: concentric rings that swell with the voice. */
export function VoiceOrb({ levelRef, active, size = 40 }: Props & { size?: number }) {
  const inner = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Idle: hand the animation to CSS and schedule nothing. This orb is mounted
    // on every route, and a 60 fps JS loop behind the Three.js VR scene was
    // enough to push /vr's first paint past its 800 ms budget. The keyframes
    // live in index.css and run on the compositor.
    if (!active) {
      if (ring.current) {
        ring.current.style.transform = '';
        ring.current.style.opacity = '0.45';
        ring.current.style.animation = 'krc-guide-sweep 9s linear infinite';
      }
      if (inner.current) inner.current.style.transform = '';
      if (halo.current) {
        halo.current.style.transform = '';
        halo.current.style.animation = 'krc-guide-breathe 4s ease-in-out infinite';
      }
      return;
    }

    // Active: take it back, and follow the actual waveform.
    if (ring.current) ring.current.style.animation = '';
    if (halo.current) halo.current.style.animation = '';

    let frame = 0;
    let angle = 0;
    let previous = 0;

    const tick = (time: number): void => {
      const delta = previous ? Math.min(64, time - previous) : 16;
      previous = time;

      const level = levelRef.current ?? 0;
      // A slow breath underneath, so the orb is alive before anyone speaks.
      const breath = active ? 0.5 + 0.5 * Math.sin(time / 900) : 0;

      // The ring always turns; it turns faster the louder the room. That is the
      // whole trick — it reads as the guide listening harder.
      angle = (angle + delta * (0.02 + level * 0.32)) % 360;

      if (ring.current) {
        ring.current.style.transform = `rotate(${angle.toFixed(1)}deg)`;
        ring.current.style.opacity = String(active ? 0.7 + level * 0.3 : 0.45);
      }
      if (inner.current) {
        inner.current.style.transform = `scale(${(1 + level * 0.3 + breath * 0.04).toFixed(3)})`;
      }
      if (halo.current) {
        halo.current.style.transform = `scale(${(1 + level * 0.85 + breath * 0.1).toFixed(3)})`;
        halo.current.style.opacity = String(active ? 0.3 + level * 0.5 : 0.14);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, levelRef]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        ref={halo}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 62%)` }}
      />
      {/* The moving ring: a conic sweep masked down to a hairline, so it reads as
          a single arc travelling around the orb rather than a spinning disc. */}
      <div
        ref={ring}
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, rgba(144,199,255,0) 0deg, rgba(144,199,255,0) 205deg, ${ACCENT} 300deg, #ffffff 348deg, rgba(144,199,255,0) 360deg)`,
          // Masked to a defined annulus: a full disc reads as a spinning plate,
          // a hairline disappears at 38 px. This is the band in between.
          WebkitMask: 'radial-gradient(circle, transparent 60%, #000 66%, #000 88%, transparent 96%)',
          mask: 'radial-gradient(circle, transparent 60%, #000 66%, #000 88%, transparent 96%)',
        }}
      />
      <div
        ref={inner}
        className="absolute inset-[30%] rounded-full"
        style={{
          background: 'linear-gradient(140deg, #dbeeff 0%, #90C7FF 35%, #2563eb 100%)',
          boxShadow: '0 0 12px rgba(144,199,255,0.6), inset 0 1px 2px rgba(255,255,255,0.75)',
        }}
      />
    </div>
  );
}

const BARS = 28;

/**
 * The listening state. A scrolling history of the last ~1.5 s of loudness, so
 * the visitor can see their own sentence being taken down — and, just as
 * importantly, see it go flat when they stop, which is the moment the guide
 * takes over.
 */
export function Waveform({ levelRef }: Pick<Props, 'levelRef'>) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = new Array<number>(BARS).fill(0);
    let frame = 0;
    let last = 0;

    const tick = (time: number): void => {
      // ~20 Hz: fast enough to read as live, slow enough that the bars travel
      // rather than flicker.
      if (time - last > 50) {
        last = time;
        history.push(levelRef.current ?? 0);
        history.shift();
        const bars = host.current?.children;
        if (bars) {
          for (let i = 0; i < bars.length; i += 1) {
            const value = history[i] ?? 0;
            const bar = bars[i] as HTMLElement;
            bar.style.height = `${Math.max(2, value * 20).toFixed(1)}px`;
            bar.style.opacity = String(0.3 + value * 0.7);
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [levelRef]);

  return (
    <div ref={host} className="flex items-center gap-[3px] h-5" aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{ height: 2, background: ACCENT, transition: 'height 60ms linear' }}
        />
      ))}
    </div>
  );
}
