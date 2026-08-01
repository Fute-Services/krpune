import React, { useEffect, useRef, useState } from "react";
import usePanoramaEngine from "@/components/Panorama/usePanoramaEngine";
import { loadManifest, resolveSource } from "@/components/Panorama/assets";

export interface PanoramaViewerProps {
  imageUrl: string;
  width?: string;
  height?: string;
  autoRotate?: boolean;
  fov?: number;
  title?: string;
}

/**
 * The amenities 360 viewer.
 *
 * The props are unchanged from the original hand-rolled three.js version, so
 * GroundLevel / PodiumLevel / TerraceLevel / LobbyReception need no edits. What
 * changed is underneath: it now runs on the shared PanoramaEngine, which brings
 * a crossfade between scenes (this used to be a hard cut), drag inertia, wheel
 * and pinch zoom, and mipmapped + anisotropic filtering so detail stops
 * shimmering as the view drifts.
 */
export default function PanoramaViewer({
  imageUrl,
  width = "100%",
  height = "100vh",
  autoRotate = true,
  fov = 75,
  // title,
}: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const shown = useRef(false);

  // false on iPad/iPhone Safari, which exposes the Fullscreen API for <video>
  // only. A browser capability, so it never changes for the life of the page —
  // no state or effect needed.
  const canFullscreen =
    typeof document !== 'undefined' && document.fullscreenEnabled === true;

  const engine = usePanoramaEngine(mountRef, {
    fov,
    minFov: 30,
    maxFov: 100,
    // Always configure a speed; `autoRotate` is applied through setAutoRotate
    // below so it can be toggled after mount.
    autoRotateSpeed: 2,
    autoRotateDelay: 3000,
    textureCacheSize: 3,
  });

  useEffect(() => {
    engine?.setAutoRotate(autoRotate);
  }, [engine, autoRotate]);

  // Swap panoramas by blending, keeping the previous one on screen until the
  // next has decoded — there is never a blank frame in between.
  useEffect(() => {
    if (!engine || !imageUrl) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      // Must be awaited, not fired-and-forgotten from a mount effect.
      // resolveSource() falls back to the *original* URL whenever the manifest
      // has not arrived yet — and those originals are deliberately left out of
      // the offline media manifest, because an optimized sibling supersedes
      // them. So losing this race meant a 404 and a black viewer with the
      // network off. VRPage awaits it for the same reason.
      await loadManifest();
      if (cancelled) return;

      const source = resolveSource(imageUrl);
      try {
        if (!shown.current) {
          if (source.preview) {
            await engine.show(source.preview);
            if (cancelled) return;
            setIsLoading(false);
            shown.current = true;
            await engine.crossfadeTo(source.full, 350);
            return;
          }
          await engine.show(source.full);
          shown.current = true;
        } else {
          await engine.crossfadeTo(source.full, 600);
        }
        if (!cancelled) setIsLoading(false);
      } catch (err) {
        console.error("PanoramaViewer: failed to load panorama", err);
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, imageUrl]);

  const zoom = (direction: number) => {
    if (!engine) return;
    engine.setFov(engine.getFov() + direction * 8, 300);
    engine.markActive();
  };

  const toggleFullscreen = () => {
    const el = mountRef.current?.parentElement;
    // iOS Safari implements the Fullscreen API for <video> only — on an iPad
    // `el.requestFullscreen` is undefined, so calling it throws a TypeError
    // *synchronously* and the .catch() below never gets the chance to run.
    // Feature-detect rather than assume; canFullscreen also hides the button,
    // so this is belt and braces.
    if (!document.fullscreenElement) {
      if (typeof el?.requestFullscreen !== 'function') return;
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      if (typeof document.exitFullscreen !== 'function') return;
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Every caller asks for the full viewport. Hand that case to the h-viewport
  // class (index.css) instead of an inline height, so it gets the
  // 100vh -> 100dvh fallback and stops running under Safari's toolbar on iOS.
  // An inline style can only carry one value, and a bare "100dvh" would
  // collapse the container to zero height on anything older than iOS 15.4.
  const fullViewport = height === "100vh" || height === "100dvh";

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      position: "relative",
      width,
      height: fullViewport ? undefined : height,
      background: "#000000",
      overflow: "hidden",
      fontFamily: "sans-serif",
      userSelect: "none",
    },
    canvas: { width: "100%", height: "100%", touchAction: "none" },
    loader: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.9)",
      color: "#ffffff",
      gap: "14px",
      zIndex: 10,
    },
    spinner: {
      width: "36px",
      height: "36px",
      border: "3px solid rgba(255, 255, 255, 0.1)",
      borderTop: "3px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    controls: { position: "absolute", top: "14px", right: "14px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 5 },
    btn: { width: "36px", height: "36px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)" },
    badge: { position: "absolute", bottom: "14px", left: "14px", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "8px", color: "#fff", fontSize: "12px", zIndex: 5 },
  };

  return (
    <div className={fullViewport ? "h-viewport" : undefined} style={styles.wrapper}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div ref={mountRef} style={styles.canvas} />

      {/* Only cover the view before the FIRST panorama arrives. Later scene
          changes blend in place, so a loader over them would be a step back. */}
      {isLoading && !shown.current && (
        <div style={styles.loader}>
          <div style={styles.spinner} />
        </div>
      )}

      {!isLoading && (
        <div style={styles.controls}>
          <button style={styles.btn} onClick={() => zoom(-1)}>+</button>
          <button style={styles.btn} onClick={() => zoom(1)}>−</button>
          {/* Hidden where the API does not exist (iPad/iPhone Safari). A button
              that can only ever do nothing is worse than no button — and the
              panorama already fills the viewport there. */}
          {canFullscreen && (
            <button style={styles.btn} onClick={toggleFullscreen}>{isFullscreen ? "⊠" : "⛶"}</button>
          )}
        </div>
      )}
    </div>
  );
}
