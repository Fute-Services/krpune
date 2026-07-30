import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import backImg from "../../assets/back.png";
import { getVrTour } from "@/data/offlineApi";
import usePanoramaEngine from "@/components/Panorama/usePanoramaEngine";
import { loadManifest, resolveSource } from "@/components/Panorama/assets";
import type { Marker, MarkerSpec } from "@/components/Panorama/FloorMarkers";
import type { PanoramaScene } from "@/components/Panorama/types";

/** Wide by default — the tour should always open zoomed out. */
const DEFAULT_FOV = 100;
const MIN_FOV = 40;
const MAX_FOV = 110;
const ZOOM_STEP = 12;

const DISPLAY_NAMES: Record<string, string> = {
    entrygate: "GROUND LEVEL",
    dropoff: "DROP OFF",
    reception: "RECEPTION",
    cafeteria: "CAFETERIA",
    // The tour data uses "Lift Lobby" (with a space) as the scene id, so that
    // is the key the badge has to look up.
    "Lift Lobby": "LIFT LOBBY",
    liftlobby: "LIFT LOBBY",
    podium1: "PODIUM 1",
    podium2: "PODIUM 2",
    terrace: "MULTIPURPOSE COURT",
    terrace1: "TERRACE AMENITIES",
    terrace2: "FOOD COURT",
    terrace_sports: "SPORTS ZONE",
    retail: "RETAIL ZONE",
};

/** One on-screen signpost: the arrow asset plus the name it walks you to. */
interface Signpost {
    id: string;
    label: string;
    x: number;
    y: number;
    /** Degrees, straight from the tour data — points down the real corridor. */
    rotation: number;
}

export default function Vr() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const [scenes, setScenes] = useState<Record<string, PanoramaScene>>({});
    const [currentScene, setCurrentScene] = useState<string>("");
    const [walking, setWalking] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const [hovered, setHovered] = useState<{ label: string; x: number; y: number } | null>(null);

    /**
     * Where each destination's signpost sits on screen this frame.
     *
     * The floor rings alone were not readable on a tablet — nothing about a
     * ring says "tap here to walk there", and visitors just stood still. The
     * tour's original arrow-and-label signposts go back on top of them, which
     * is the affordance people actually recognise.
     */
    const [signposts, setSignposts] = useState<Signpost[]>([]);
    /** Last frame we pushed to React, so a still camera costs nothing. */
    const signpostsRef = useRef<Signpost[]>([]);
    const lastSignpostPush = useRef(0);

    // Read inside engine callbacks, which are registered once.
    const scenesRef = useRef(scenes);
    scenesRef.current = scenes;

    const engine = usePanoramaEngine(containerRef, {
        fov: DEFAULT_FOV,
        minFov: MIN_FOV,
        maxFov: MAX_FOV,
        autoRotateSpeed: -5,
        autoRotateDelay: 1000,
        // A 6000×3000 panorama costs ~96 MB of VRAM with mipmaps, so the whole
        // 12-scene tour will not fit on the GPU at once. Four keeps the current
        // scene plus its immediate neighbours resident.
        textureCacheSize: 4,
    });

    // ── Load the tour graph ──
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await loadManifest();
                const data = await getVrTour();
                if (cancelled) return;

                const parsed: Record<string, PanoramaScene> = {};
                Object.keys(data.scenes).forEach((id) => {
                    const raw = data.scenes[id];
                    parsed[id] = {
                        id,
                        url: import.meta.env.BASE_URL + raw.panorama,
                        yaw: raw.yaw ?? 0,
                        pitch: raw.pitch ?? 0,
                        hotSpots: (raw.hotSpots || []).map((h: any) => ({
                            pitch: h.pitch ?? 0,
                            yaw: h.yaw ?? 0,
                            text: h.createTooltipArgs?.text?.trim(),
                            next: h.createTooltipArgs?.next,
                            rotation: h.createTooltipArgs?.rotation ?? 0,
                        })),
                    };
                });

                setScenes(parsed);
                setCurrentScene(data.default.firstScene);
            } catch (err) {
                console.error("VR tour failed to load", err);
                if (!cancelled) setError(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const scene = scenes[currentScene];

    /**
     * The blurred stand-in for the opening scene, shown as an ordinary CSS
     * background while the real panorama is still decoding.
     *
     * This is the whole fix for the black screen. It is a 1024×512 JPEG painted
     * by the normal image pipeline — no WebGL, no texture upload, no mipmap
     * generation — so it appears in tens of milliseconds instead of waiting on
     * the seconds those three steps cost for an equirectangular panorama.
     * Undefined until `npm run panos:optimize` has been run, in which case the
     * cover stays black exactly as before.
     */
    const previewUrl = scene ? resolveSource(scene.url).preview : undefined;

    // ── Show the first panorama ──
    useEffect(() => {
        if (!engine || !scene || ready) return;
        let cancelled = false;

        (async () => {
            const source = resolveSource(scene.url);
            try {
                // Straight to the full image. The earlier version put the
                // preview on the sphere first and crossfaded, which meant two
                // texture uploads and two blends for one arrival — and the
                // screen was still black through the first of them, because
                // even a small texture waits on the engine being ready. The CSS
                // cover above covers that window for free.
                await engine.show(source.full, { lon: scene.yaw ?? 0, lat: scene.pitch ?? 0 });
                if (cancelled) return;
                setReady(true);
            } catch (err) {
                console.error("VR panorama failed to load", err);
                if (!cancelled) setError(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [engine, scene, ready]);

    // ── Walking to another scene ──
    const walkTo = useCallback(
        async (marker: Marker) => {
            const engineRef = engine;
            const target = scenesRef.current[marker.id];
            if (!engineRef || !target || engineRef.isTransitioning) return;

            setWalking(true);
            setHovered(null);
            try {
                // No arrival yaw/pitch: walking carries your heading with you,
                // so the place you came from stays behind you. The distance is
                // what sizes and times the journey.
                await engineRef.walkTo(
                    resolveSource(target.url).full,
                    { yaw: marker.yaw, pitch: marker.pitch, distance: marker.distance },
                    { fov: DEFAULT_FOV }
                );
                setCurrentScene(target.id);
            } catch (err) {
                console.error("VR walk failed", err);
            } finally {
                setWalking(false);
            }
        },
        [engine]
    );

    // ── Wire the floor markers to the engine ──
    useEffect(() => {
        if (!engine) return;
        engine.onMarkerActivate = (marker) => {
            walkTo(marker);
        };
        engine.onMarkerHover = (marker) => {
            if (!marker?.label) {
                setHovered(null);
                return;
            }
            const point = engine.projectMarker(marker);
            setHovered(point.visible ? { label: marker.label, x: point.x, y: point.y } : null);
        };
        return () => {
            engine.onMarkerActivate = null;
            engine.onMarkerHover = null;
        };
    }, [engine, walkTo]);

    // Destinations reachable from here, laid out on the floor.
    const markers = useMemo<MarkerSpec[]>(
        () =>
            (scene?.hotSpots || [])
                .filter((h) => Boolean(h.next))
                .map((h) => ({
                    id: h.next,
                    yaw: h.yaw,
                    pitch: h.pitch,
                    label: h.text || DISPLAY_NAMES[h.next] || h.next,
                })),
        [scene]
    );

    useEffect(() => {
        if (!engine || !ready) return;
        engine.setMarkers(markers);
    }, [engine, markers, ready]);

    /**
     * Rings off — the arrow signposts do the signposting now.
     *
     * Re-applied whenever the markers change, because a scene change rebuilds
     * the ring meshes from scratch. Their hit discs survive this, so the floor
     * around an arrow is still a generous touch target.
     */
    useEffect(() => {
        engine?.setRingsVisible(false);
    }, [engine, markers, ready]);

    /**
     * The rotation each signpost's arrow is drawn at, keyed by destination.
     *
     * These angles come straight from the original tour data
     * (`createTooltipArgs.rotation`) — they were authored per hotspot so the
     * arrow points down the corridor you actually walk, not at the camera.
     */
    const arrowRotations = useMemo(() => {
        const byDestination: Record<string, number> = {};
        (scene?.hotSpots || []).forEach((h) => {
            if (h.next) byDestination[h.next] = h.rotation ?? 0;
        });
        return byDestination;
    }, [scene]);

    /**
     * Re-project the signposts every frame.
     *
     * They are DOM, but they have to track a 3D position through drag, zoom,
     * auto-rotate and the walk animation — so the position is recomputed on the
     * engine's own frame callback rather than on React state changes.
     */
    useEffect(() => {
        if (!engine) return;

        // Nothing to point at until a panorama is up, and during a walk the
        // signposts would slide across a scene that is already dissolving.
        if (!ready || walking) {
            signpostsRef.current = [];
            setSignposts([]);
            return;
        }

        engine.onFrame = () => {
            const next: Signpost[] = [];
            for (const marker of engine.navigationMarkers) {
                const point = engine.projectMarker(marker);
                if (!point.visible) continue;
                next.push({
                    id: marker.id,
                    label: marker.label || DISPLAY_NAMES[marker.id] || marker.id,
                    // Whole pixels: sub-pixel jitter would re-render on a
                    // camera that has effectively stopped moving.
                    x: Math.round(point.x),
                    y: Math.round(point.y),
                    rotation: arrowRotations[marker.id] ?? 0,
                });
            }

            // Two guards, because this runs at display refresh rate and each
            // push re-renders. Cap the rate, and skip entirely when the camera
            // is still — which is most of the time a visitor is reading.
            const now = performance.now();
            if (now - lastSignpostPush.current < 33) return;

            const previous = signpostsRef.current;
            const unchanged =
                previous.length === next.length &&
                previous.every((p, i) => {
                    const n = next[i];
                    return p.id === n.id && p.x === n.x && p.y === n.y && p.rotation === n.rotation;
                });
            if (unchanged) return;

            lastSignpostPush.current = now;
            signpostsRef.current = next;
            setSignposts(next);
        };

        return () => {
            engine.onFrame = null;
        };
    }, [engine, ready, walking, arrowRotations]);

    // ── Keep the scenes one step away warm, so a walk never waits ──
    useEffect(() => {
        if (!engine || !scene || !ready) return;
        const neighbours = (scene.hotSpots || [])
            .map((h) => scenes[h.next]?.url)
            .filter((url): url is string => Boolean(url))
            .map((url) => resolveSource(url).full);
        engine.prewarm(Array.from(new Set(neighbours)));
    }, [engine, scene, scenes, ready]);

    const zoom = (direction: number) => {
        if (!engine) return;
        engine.setFov(engine.getFov() + direction * ZOOM_STEP, 300);
        engine.markActive();
    };

    const sceneName = DISPLAY_NAMES[currentScene] || currentScene;

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden">
            {/* 🔙 Back Button */}
            <button
                className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 lg:top-[24px] lg:left-[24px] xl:top-[30px] xl:left-[40px] w-[38px] h-[38px] sm:w-11 sm:h-11 lg:w-[44px] lg:h-[44px] xl:w-[50px] xl:h-[50px] rounded-[30%] bg-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                onClick={() => navigate(-1)}
            >
                <img src={backImg} alt="Back" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
            </button>

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black">
                    <div className="text-white text-xl mb-4">Unable to load Virtual Tour</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* 🎥 Viewer — the floor markers live inside the 3D scene */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Signposts — the arrow-and-label markers the tour originally had.
                They sit over the floor rings rather than replacing them: the
                ring is the target you walk onto, the arrow is what tells a
                visitor there is somewhere to go and names it. Restored because
                the rings on their own read as decoration on a tablet. */}
            {!walking &&
                signposts.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                            const marker = engine?.navigationMarkers.find((m) => m.id === s.id);
                            if (marker) walkTo(marker);
                        }}
                        aria-label={`Walk to ${s.label}`}
                        // -translate-x-1/2 centres it on the ring; the arrow is
                        // lifted clear of the ring so both stay readable.
                        className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 border-0 bg-transparent p-2 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                        style={{ left: s.x, top: s.y }}
                    >
                        <img
                            src="/VR/arrowfinal.png"
                            alt=""
                            draggable={false}
                            className="w-9 h-9 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] md:w-11 md:h-11"
                            style={{ transform: `rotate(${s.rotation}deg)` }}
                        />
                        <span className="whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm md:text-[11px]">
                            {s.label}
                        </span>
                    </button>
                ))}

            {/* Name of the spot under the pointer. Only when the signposts are
                not up — otherwise every destination is labelled twice. */}
            {hovered && !walking && signposts.length === 0 && (
                <div
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-sm md:text-xs"
                    style={{ left: hovered.x, top: hovered.y - 18 }}
                >
                    {hovered.label}
                </div>
            )}

            {/* First-paint cover — fades away as soon as the panorama is on the
                sphere, so the route crossfade never reveals an empty canvas.

                It carries the blurred preview when one exists, which turns the
                old several-second black hole into the scene appearing straight
                away and then sharpening. Deliberately not a spinner: there is
                nothing to wait for once you can see where you are. */}
            <div
                className="absolute inset-0 z-30 bg-black bg-cover bg-center transition-opacity duration-500 pointer-events-none"
                style={{
                    opacity: ready ? 0 : 1,
                    backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                }}
            />

            {/* 🔍 Zoom Controls */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:gap-4">
                <button
                    onClick={() => zoom(-1)}
                    className="
                        w-9 h-9 md:w-12 md:h-12
                        bg-white/10 backdrop-blur-md border border-white/20 rounded-full
                        text-white text-lg md:text-2xl
                        flex items-center justify-center
                        hover:bg-white hover:text-black transition-all shadow-lg
                    "
                >+</button>
                <button
                    onClick={() => zoom(1)}
                    className="
                        w-9 h-9 md:w-12 md:h-12
                        bg-white/10 backdrop-blur-md border border-white/20 rounded-full
                        text-white text-lg md:text-2xl
                        flex items-center justify-center
                        hover:bg-white hover:text-black transition-all shadow-lg
                    "
                >−</button>
            </div>

            {/* 📍 Scene Name Badge */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-black/70 text-white px-5 py-2 md:px-8 md:py-3 rounded-full text-xs md:text-sm tracking-wide">
                    {sceneName}
                </div>
            </div>
        </div>
    );
}
