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

/**
 * One on-screen signpost: the arrow asset plus the name it walks you to.
 *
 * Deliberately no x/y. The screen position is written straight onto the DOM
 * node every frame (see the placement effect) rather than held in React state —
 * see the comment there for why.
 */
interface Signpost {
    id: string;
    label: string;
    /** Degrees, straight from the tour data — points down the real corridor. */
    rotation: number;
}

/**
 * Whether this device has a pointer that can hover.
 *
 * On a touch tablet it cannot, and that is the device this tour ships on. The
 * engine only raycasts for hover on a pointer that is *not* pressed
 * (updateFloorHover, called from onPointerMove), and a finger is always
 * pressed — so `hoveredId` never fires and CSS `:hover` never matches either.
 * Measured on an emulated iPad: the destination name sat at opacity 0 before,
 * during and after a tap on both engines. Twelve unlabelled arrows is the
 * problem the labels were added to solve, so where hover does not exist the
 * names are simply shown.
 */
function useCanHover(): boolean {
    const [canHover, setCanHover] = useState(
        () => typeof window === "undefined" || window.matchMedia?.("(hover: hover)").matches !== false,
    );

    useEffect(() => {
        const query = window.matchMedia?.("(hover: hover)");
        if (!query) return;
        const sync = () => setCanHover(query.matches);
        sync();
        // An iPad gains a hovering pointer the moment a trackpad case is
        // attached, and loses it again when it is removed.
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    return canHover;
}

export default function Vr() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const canHover = useCanHover();

    const [scenes, setScenes] = useState<Record<string, PanoramaScene>>({});
    const [currentScene, setCurrentScene] = useState<string>("");
    const [walking, setWalking] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    /** Destination whose name the pointer is currently over, if any. */
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    /**
     * The signpost DOM nodes, keyed by destination, so the frame callback can
     * move them without going through React.
     */
    const signpostNodes = useRef(new Map<string, HTMLButtonElement>());

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
            setHoveredId(null);
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
        // Hovering the floor around an arrow counts as hovering the arrow: the
        // hit disc is far more generous than the 44 px image, and the name is
        // what tells you where the arrow goes.
        engine.onMarkerHover = (marker) => {
            setHoveredId(marker?.id ?? null);
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
     * Which signposts exist, and how their arrows are turned.
     *
     * This is the only part React renders, and it only changes when the scene
     * does — the positions do not live here on purpose (see below).
     */
    const signposts = useMemo<Signpost[]>(
        () =>
            markers.map((m) => ({
                id: m.id,
                label: m.label || DISPLAY_NAMES[m.id] || m.id,
                rotation: arrowRotations[m.id] ?? 0,
            })),
        [markers, arrowRotations]
    );

    /**
     * Re-project the signposts every frame, straight onto their DOM nodes.
     *
     * The positions used to be React state, pushed from the frame callback and
     * throttled to 30 Hz with whole-pixel rounding. That is what made the arrows
     * flicker: the panorama redraws at the display's refresh rate, so the arrows
     * were repainted at half that and snapped a pixel at a time, which reads as
     * a shimmer against a smoothly moving background — worst of all during the
     * slow auto-rotate, when the camera never stops.
     *
     * Writing `transform` on the node instead tracks the camera exactly, at
     * sub-pixel precision, with no re-render at all — so there is nothing left
     * to throttle and nothing to round.
     */
    useEffect(() => {
        if (!engine || !ready) return;

        const place = () => {
            const placed = new Set<string>();
            for (const marker of engine.navigationMarkers) {
                const node = signpostNodes.current.get(marker.id);
                if (!node) continue;
                placed.add(marker.id);
                const point = engine.projectMarker(marker);
                if (!point.visible) {
                    node.style.visibility = "hidden";
                    continue;
                }
                // translate3d first, then centre on the point: the arrow is a
                // fixed-size box, so the -50% cannot be folded into the pixels.
                node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
                node.style.visibility = "visible";
            }
            // A node React has mounted but the engine does not know about yet
            // must stay hidden, or it would sit in the top-left corner for a
            // frame after a scene change.
            signpostNodes.current.forEach((node, id) => {
                if (!placed.has(id)) node.style.visibility = "hidden";
            });
        };

        place();
        engine.onFrame = place;
        return () => {
            if (engine.onFrame === place) engine.onFrame = null;
        };
    }, [engine, ready, signposts]);

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
                the rings on their own read as decoration on a tablet.

                The whole layer fades out for the walk rather than unmounting:
                the arrows keep their DOM nodes across the journey, so the frame
                callback never has to wait for React to hand it new ones. */}
            <div
                className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
                style={{ opacity: walking ? 0 : 1 }}
            >
                {signposts.map((s) => {
                    // The label follows the pointer's own arrow, whether hover
                    // landed on this button or on the wider floor disc the
                    // engine raycasts against. On a device that cannot hover
                    // there is no such pointer, so every name is shown — see
                    // useCanHover.
                    const named = hoveredId === s.id || !canHover;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            ref={(el) => {
                                if (el) signpostNodes.current.set(s.id, el);
                                else signpostNodes.current.delete(s.id);
                            }}
                            onClick={() => {
                                const marker = engine?.navigationMarkers.find((m) => m.id === s.id);
                                if (marker) walkTo(marker);
                            }}
                            aria-label={`Walk to ${s.label}`}
                            disabled={walking}
                            // left/top stay at 0: the frame callback positions
                            // this with `transform`, which is also what carries
                            // the centring. Hidden until it has been placed.
                            className="group pointer-events-auto absolute left-0 top-0 flex cursor-pointer flex-col items-center border-0 bg-transparent p-2"
                            style={{ visibility: "hidden" }}
                        >
                            {/* Hover growth lives on this wrapper — the button's
                                own transform is the position and cannot be
                                shared. */}
                            <span className="block transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                                <img
                                    src="/VR/arrowfinal.png"
                                    alt=""
                                    draggable={false}
                                    className="w-9 h-9 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] md:w-11 md:h-11"
                                    style={{ transform: `rotate(${s.rotation}deg)` }}
                                />
                            </span>
                            {/* The name is a hover reveal: twelve arrows each
                                shouting their destination buried the panorama.
                                Absolutely positioned so appearing costs the
                                arrow no layout shift. */}
                            <span
                                className={`pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm transition-opacity duration-150 md:text-[11px] ${
                                    named
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                                }`}
                            >
                                {s.label}
                            </span>
                        </button>
                    );
                })}
            </div>

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
