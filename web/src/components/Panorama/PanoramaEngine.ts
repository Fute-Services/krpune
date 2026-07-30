import * as THREE from "three";
import FloorMarkers, { EYE_HEIGHT } from "./FloorMarkers";
import type { Marker, MarkerSpec } from "./FloorMarkers";
import type { EngineOptions, Hotspot, Orientation } from "./types";

/**
 * PanoramaEngine — the shared 360° viewer behind both the VR tour and the
 * amenities pages.
 *
 * It replaces two earlier implementations:
 *   • Pannellum 2.5.7 on /vr, whose "transition" was a flat 2D snapshot
 *     dissolving into the next image — the camera never moved, so it read as a
 *     slideshow rather than walking somewhere.
 *   • A hand-rolled three.js viewer on the amenities pages, which swapped the
 *     sphere mesh outright (a hard cut) and had no drag inertia or wheel zoom.
 *
 * The engine keeps TWO spheres alive at all times — `front` (what you see) and
 * `back` (what is arriving) — so a scene change can blend rather than cut, and
 * the camera can dolly forward through the blend.
 */

// ── Geometry ──────────────────────────────────────────────────────────────
const RADIUS = 500;
const WIDTH_SEGMENTS = 64;
const HEIGHT_SEGMENTS = 48;

// ── Walk transition timing (ms). WALK_SPEED scales the whole sequence, so
//    the whole feel can be tuned from one number. ─────────────────────────
export const WALK_SPEED = 1;
const ALIGN_MS = 400 * WALK_SPEED; // turn to face the way we are going

/**
 * A journey is timed and sized by how far the destination actually is, read off
 * the marker's position on the floor. Stepping to a spot two metres away should
 * not take as long, or move you as far, as walking to one down the corridor —
 * that difference is a large part of what makes the tour feel like a place
 * rather than a slideshow.
 */
const WALK_MS_BASE = 900 * WALK_SPEED;
const WALK_MS_PER_METRE = 170 * WALK_SPEED;
const WALK_MS_MIN = 1200 * WALK_SPEED;
const WALK_MS_MAX = 2600 * WALK_SPEED;

/** World units travelled per metre of real-world distance. */
const TRAVEL_PER_METRE = 30;
const TRAVEL_MIN = 70;
/** Beyond this the equirectangular image stretches and stops looking real. */
const TRAVEL_MAX = 190;
/** Used when a destination carries no distance of its own. */
const DEFAULT_DISTANCE_M = 4;

/**
 * When the blend happens, as a fraction of the journey. It sits in the middle,
 * where the camera is at full stride — so the picture changes while you are
 * moving, never while you are stopped.
 */
const FADE_FROM = 0.3;
const FADE_TO = 0.8;

/**
 * Arrows sit on the floor, so turning to look straight at one would tip the
 * camera down at your own feet before setting off — nobody walks like that.
 * The turn takes the arrow's bearing in full but only a trace of its downward
 * angle, so the view stays level and forward the whole way.
 */
const ALIGN_PITCH_DAMP = 0.15;

/**
 * The forward motion stays level for the same reason: travelling along a
 * downward-tilted view would drive the camera into the ground.
 */
const DOLLY_PITCH_DAMP = 0.15;

const LAT_LIMIT = 85;

/**
 * How long a walk will wait for its destination to decode before giving up and
 * settling back where it started. Without a ceiling a stalled request would
 * leave the tour mid-stride with its arrows hidden and no way out.
 */
const LOAD_TIMEOUT_MS = 12000;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Distance travelled at time `t` for a walking gait: speed ramps up, holds
 * steady for most of the journey, then eases off on arrival.
 *
 * The usual ease-in-out curves spend almost the whole time accelerating or
 * braking, which reads as a lurch. A trapezoidal speed profile has a long
 * constant-velocity middle — that steady stretch is what makes it feel like
 * covering ground rather than being nudged.
 */
const RAMP_UP = 0.3;
const RAMP_DOWN = 0.7;
const WALK_AREA = RAMP_UP / 2 + (RAMP_DOWN - RAMP_UP) + (1 - RAMP_DOWN) / 2;
const easeWalk = (t: number) => {
    let d: number;
    if (t < RAMP_UP) {
        d = (t * t) / (2 * RAMP_UP);
    } else if (t < RAMP_DOWN) {
        d = RAMP_UP / 2 + (t - RAMP_UP);
    } else {
        const s = t - RAMP_DOWN;
        const tail = 1 - RAMP_DOWN;
        d = RAMP_UP / 2 + (RAMP_DOWN - RAMP_UP) + s - (s * s) / (2 * tail);
    }
    return d / WALK_AREA;
};

/** Shortest signed angular distance from `a` to `b`, in degrees. */
const shortestDelta = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export interface ScreenPoint {
    x: number;
    y: number;
    visible: boolean;
}

export default class PanoramaEngine {
    readonly renderer: THREE.WebGLRenderer;
    readonly camera: THREE.PerspectiveCamera;

    private readonly container: HTMLElement;
    private readonly scene = new THREE.Scene();
    private readonly geometry: THREE.SphereGeometry;

    private front: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    private back: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;

    /**
     * Rotation (degrees) applied to the sphere so the incoming scene's intended
     * facing lines up with wherever the camera already points. Rotating the
     * *world* instead of snapping the *camera* is what keeps a walk continuous:
     * the viewer never sees the view jump at the moment the scenes swap.
     * Hotspots are projected through this same offset.
     */
    private yawOffset = 0;
    private pendingYawOffset = 0;

    // Camera state, in degrees.
    private orientation: Orientation;
    private baseFov: number;
    private fov: number;
    private readonly minFov: number;
    private readonly maxFov: number;

    // Drag + inertia.
    private dragging = false;
    private lastPointer = { x: 0, y: 0 };
    private velocity = { lon: 0, lat: 0 };
    private activePointers = new Map<number, { x: number; y: number }>();
    private pinchDistance = 0;

    // Idle auto-rotation.
    private readonly autoRotateSpeed: number;
    private readonly autoRotateDelay: number;
    private idleSince = 0;
    private autoRotateEnabled: boolean;

    // Texture cache (see `textureCacheSize` in EngineOptions for why it exists).
    private readonly textures = new Map<string, THREE.Texture>();
    private readonly inFlight = new Map<string, Promise<THREE.Texture>>();
    private readonly cacheLimit: number;
    private frontUrl = "";
    private backUrl = "";

    // Render loop.
    private rafId = 0;
    private dirty = true;
    private lastFrame = 0;
    private disposed = false;
    private resizeObserver: ResizeObserver | null = null;

    private transitioning = false;
    private fovTween: { from: number; to: number; start: number; duration: number } | null = null;

    // Floor navigation.
    private readonly floorMarkers: FloorMarkers;
    private readonly raycaster = new THREE.Raycaster();
    private readonly pointerNdc = new THREE.Vector2();
    /** Where the pointer went down, to tell a click apart from a drag. */
    private pressAt: { x: number; y: number } | null = null;
    /** Distance travelled in the journey currently under way, in world units. */
    private travelUnits = TRAVEL_MIN;

    /** Notified whenever a frame is rendered, so overlays can reposition. */
    onFrame: (() => void) | null = null;
    /** A floor marker was chosen — by clicking it, or by clicking its way. */
    onMarkerActivate: ((marker: Marker) => void) | null = null;
    /** The marker under the pointer changed. */
    onMarkerHover: ((marker: Marker | null) => void) | null = null;

    constructor(container: HTMLElement, options: EngineOptions = {}) {
        this.container = container;

        this.baseFov = options.fov ?? 90;
        this.fov = this.baseFov;
        this.minFov = options.minFov ?? 40;
        this.maxFov = options.maxFov ?? 110;
        this.autoRotateSpeed = options.autoRotateSpeed ?? 0;
        this.autoRotateDelay = options.autoRotateDelay ?? 3000;
        this.autoRotateEnabled = this.autoRotateSpeed !== 0;
        this.cacheLimit = Math.max(2, options.textureCacheSize ?? 4);

        // Yaw 0 = centre of the panorama (see lookDirection), which is where a
        // viewer with no explicit starting angle should open.
        this.orientation = { lon: 0, lat: 0 };

        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);

        this.camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 1100);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
        });
        // Uncapped devicePixelRatio on a 4K/200% display renders 4× the pixels
        // for no visible gain; 2 is the point of diminishing returns.
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // No tone mapping on purpose: these are finished photographic renders,
        // and any tone curve would shift the colours the client signed off on.
        this.renderer.setClearColor(0x000000, 1);
        container.appendChild(this.renderer.domElement);

        this.geometry = new THREE.SphereGeometry(RADIUS, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
        this.geometry.scale(-1, 1, 1); // view from the inside

        this.front = this.makeSphere(0);
        this.back = this.makeSphere(1);
        this.back.visible = false;
        this.scene.add(this.front, this.back);

        this.floorMarkers = new FloorMarkers(this.scene, (yaw) =>
            this.lookDirection(yaw, 0)
        );

        this.attachControls();
        this.observeResize();
        this.applyCamera();
        this.loop();
    }

    // ── Setup helpers ─────────────────────────────────────────────────────

    private makeSphere(renderOrder: number) {
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 1,
            // Depth is meaningless here — both spheres share a radius, so draw
            // order alone decides what lands on top during a crossfade.
            depthTest: false,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.renderOrder = renderOrder;
        return mesh;
    }

    private observeResize() {
        const onResize = () => this.resize();
        if ("ResizeObserver" in window) {
            this.resizeObserver = new ResizeObserver(onResize);
            this.resizeObserver.observe(this.container);
        }
        window.addEventListener("resize", onResize);
        this.removeWindowResize = () => window.removeEventListener("resize", onResize);
    }

    private removeWindowResize: (() => void) | null = null;

    resize() {
        const width = Math.max(1, this.container.clientWidth);
        const height = Math.max(1, this.container.clientHeight);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        // Repaint now rather than waiting for the next animation frame. A
        // resized drawing buffer keeps whatever was in it until something draws,
        // so deferring here can leave a stale band on screen — visible when the
        // window is resized or a kiosk display rotates.
        this.applyCamera();
        this.renderer.render(this.scene, this.camera);
        this.onFrame?.();
        this.dirty = false;
    }

    // ── Texture loading ───────────────────────────────────────────────────

    /**
     * Decode a panorama. Prefers `createImageBitmap`, which decodes a 6000×3000
     * JPEG off the main thread — decoding one of these inline costs well over a
     * frame, and that stall lands exactly during a transition.
     */
    loadTexture(url: string): Promise<THREE.Texture> {
        const cached = this.textures.get(url);
        if (cached) {
            // Refresh LRU position.
            this.textures.delete(url);
            this.textures.set(url, cached);
            return Promise.resolve(cached);
        }

        const existing = this.inFlight.get(url);
        if (existing) return existing;

        const promise = this.decode(url)
            .then((texture) => {
                if (this.disposed) {
                    texture.dispose();
                    throw new Error("engine disposed");
                }
                this.configureTexture(texture);
                this.textures.set(url, texture);
                this.inFlight.delete(url);
                this.evict();
                return texture;
            })
            .catch((err) => {
                this.inFlight.delete(url);
                throw err;
            });

        this.inFlight.set(url, promise);
        return promise;
    }

    private decode(url: string): Promise<THREE.Texture> {
        if (typeof createImageBitmap === "function") {
            return new Promise<THREE.Texture>((resolve, reject) => {
                const loader = new THREE.ImageBitmapLoader();
                loader.setCrossOrigin("anonymous");
                loader.setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none" });
                loader.load(
                    url,
                    (bitmap) => resolve(new THREE.Texture(bitmap as unknown as HTMLImageElement)),
                    undefined,
                    reject
                );
            }).catch(() => this.decodeWithImage(url));
        }
        return this.decodeWithImage(url);
    }

    private decodeWithImage(url: string): Promise<THREE.Texture> {
        return new Promise<THREE.Texture>((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin("anonymous");
            loader.load(url, resolve, undefined, reject);
        });
    }

    private configureTexture(texture: THREE.Texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        // The previous viewers used LinearFilter, which silently disables
        // mipmapping — that is why fine detail (railings, signage) shimmered
        // while the view auto-rotated.
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
    }

    /** Drop least-recently-used textures once over budget, never one in use. */
    private evict() {
        for (const url of Array.from(this.textures.keys())) {
            if (this.textures.size <= this.cacheLimit) break;
            if (url === this.frontUrl || url === this.backUrl) continue;
            this.textures.get(url)?.dispose();
            this.textures.delete(url);
        }
    }

    /** Warm the GPU cache for scenes reachable from here, so a walk is instant. */
    prewarm(urls: string[]) {
        urls.slice(0, Math.max(0, this.cacheLimit - 1)).forEach((url) => {
            this.loadTexture(url).catch(() => {
                /* a neighbour failing to preload must never break the tour */
            });
        });
    }

    // ── Scene changes ─────────────────────────────────────────────────────

    /** Show a panorama immediately (initial load). */
    async show(url: string, orientation?: Partial<Orientation>) {
        const texture = await this.loadTexture(url);
        if (this.disposed) return;
        this.frontUrl = url;
        this.yawOffset = 0;
        this.front.material.map = texture;
        this.front.material.opacity = 1;
        this.front.material.needsUpdate = true;
        this.front.rotation.y = 0;
        this.front.position.set(0, 0, 0);
        this.front.visible = true;
        this.back.visible = false;
        this.back.position.set(0, 0, 0);
        this.camera.position.set(0, 0, 0);
        if (orientation) {
            this.orientation = {
                lon: orientation.lon ?? this.orientation.lon,
                lat: clamp(orientation.lat ?? this.orientation.lat, -LAT_LIMIT, LAT_LIMIT),
            };
        }
        this.velocity = { lon: 0, lat: 0 };
        this.applyCamera();
        this.invalidate();
    }

    /**
     * Blend to another panorama without moving the camera. Used by the
     * amenities pages, whose scenes are a flat list rather than a walkable
     * graph, and by the reduced-motion path of `walkTo`.
     */
    async crossfadeTo(url: string, duration = 600) {
        if (this.transitioning || url === this.frontUrl) return;
        this.transitioning = true;
        try {
            // Bounded, so a stalled request cannot leave the viewer unable to
            // change scenes ever again.
            const texture = await Promise.race([
                this.loadTexture(url),
                new Promise<null>((r) => setTimeout(() => r(null), LOAD_TIMEOUT_MS)),
            ]);
            if (!texture || this.disposed) return;
            this.beginIncoming(url, texture, 0);
            await this.tween(duration, (p) => {
                this.back.material.opacity = easeInOutCubic(p);
            });
            this.commitIncoming();
        } finally {
            this.transitioning = false;
        }
    }

    /**
     * The walk. Turn toward the arrow, step forward, blend into the next
     * panorama at the peak of the step, then settle — so arriving somewhere
     * feels like having walked there.
     *
     * `arrow` is the clicked hotspot's position. `arrive.fov` is the zoom level
     * to come to rest at; heading and pitch deliberately carry over from the
     * journey rather than being reset (see walkYawOffset).
     */
    async walkTo(
        url: string,
        arrow: { yaw: number; pitch: number; distance?: number },
        arrive: { fov?: number } = {}
    ) {
        if (this.transitioning || this.disposed) return;
        this.transitioning = true;
        this.velocity = { lon: 0, lat: 0 };
        this.floorMarkers.setVisible(false);
        this.floorMarkers.setHovered(null);
        this.onMarkerHover?.(null);

        // Size and time the journey by how far away the destination really is.
        const metres = arrow.distance ?? DEFAULT_DISTANCE_M;
        this.travelUnits = clamp(metres * TRAVEL_PER_METRE, TRAVEL_MIN, TRAVEL_MAX);
        const walkMs = clamp(
            WALK_MS_BASE + metres * WALK_MS_PER_METRE,
            WALK_MS_MIN,
            WALK_MS_MAX
        );

        // Start decoding immediately — usually it is already cached by
        // `prewarm`, in which case the walk never waits at all.
        const load: { texture: THREE.Texture | null; failed: boolean } = {
            texture: null,
            failed: false,
        };
        const loading = this.loadTexture(url).then(
            (t) => {
                load.texture = t;
            },
            () => {
                load.failed = true;
            }
        );
        try {
            if (prefersReducedMotion()) {
                await Promise.race([
                    loading,
                    new Promise<void>((r) => setTimeout(r, LOAD_TIMEOUT_MS)),
                ]);
                if (load.failed || !load.texture || this.disposed) return;
                this.beginIncoming(url, load.texture, this.walkYawOffset());
                await this.tween(500, (p) => {
                    this.back.material.opacity = easeInOutCubic(p);
                });
                this.commitIncoming();
                return;
            }

            // ── Phase 1: turn to face the arrow ──
            const fromLon = this.orientation.lon;
            const fromLat = this.orientation.lat;
            const dLon = shortestDelta(fromLon, arrow.yaw + this.yawOffset);
            const dLat = clamp(arrow.pitch * ALIGN_PITCH_DAMP, -LAT_LIMIT, LAT_LIMIT) - fromLat;
            await this.tween(ALIGN_MS, (p) => {
                const e = easeInOutCubic(p);
                this.orientation.lon = fromLon + dLon * e;
                this.orientation.lat = fromLat + dLat * e;
                this.applyCamera();
            });
            if (this.disposed) return;

            // Direction of travel: where we now look, with the downward
            // component damped so we walk along the floor, not into it.
            const direction = this.lookDirection(
                this.orientation.lon,
                this.orientation.lat * DOLLY_PITCH_DAMP
            );

            // ── Phase 2: the journey — one unbroken forward move ──
            if (arrive.fov !== undefined) {
                this.baseFov = clamp(arrive.fov, this.minFov, this.maxFov);
            }
            const arrived = await this.travel(
                direction,
                load,
                url,
                this.walkYawOffset(),
                walkMs
            );
            if (this.disposed) return;

            if (arrived) {
                this.commitIncoming();
            } else {
                // Nothing loaded — walk back to where we started rather than
                // leaving the view stranded out in front of the panorama.
                const fromPos = this.camera.position.clone();
                await this.tween(500, (p) => {
                    const e = 1 - easeInOutCubic(p);
                    this.camera.position.copy(fromPos).multiplyScalar(e);
                    this.applyCamera();
                });
                this.camera.position.set(0, 0, 0);
                this.applyCamera();
            }
        } finally {
            this.transitioning = false;
            this.idleSince = performance.now();
            this.floorMarkers.setVisible(true);
            this.invalidate();
        }
    }

    /**
     * The journey itself: one continuous forward move from where you are into
     * the next location.
     *
     * The destination sphere is parked `travelUnits` ahead along the direction
     * of travel, so the camera starts far from its centre (the next place looks
     * a distance off) and finishes exactly at it. Because the camera only ever
     * moves forward — through the blend and right up to the arrival point —
     * there is no moment where motion stops or reverses, which is what made
     * earlier versions read as being teleported rather than walking.
     *
     * The camera also eases from its current pitch to the destination's along
     * the way, so arrival needs no separate settling step.
     *
     * If the destination has not decoded when the blend is due, the camera
     * holds its ground until it arrives — a pause mid-stride, never a black
     * frame. Resolves true once the blend has completed.
     */
    private travel(
        direction: THREE.Vector3,
        load: { texture: THREE.Texture | null; failed: boolean },
        url: string,
        yawOffset: number,
        durationMs: number
    ) {
        return new Promise<boolean>((resolve) => {
            const start = performance.now();
            // Heading and pitch are carried through untouched — see
            // walkYawOffset. Only the zoom eases back to its resting value.
            const fromFov = this.fov;
            const dFov = this.baseFov - fromFov;

            let held = 0;
            let last = start;
            let placed = false;
            let faded = false;

            const step = (now: number) => {
                if (this.disposed) return resolve(false);
                const frame = now - last;
                last = now;

                let elapsed = now - start - held;
                let p = clamp(elapsed / durationMs, 0, 1);

                // Hold at the point the blend is due until the panorama is ready.
                if (p >= FADE_FROM && !load.texture && !load.failed) {
                    held += frame;
                    elapsed = FADE_FROM * durationMs;
                    p = FADE_FROM;
                    // Give up only after this much time spent actually waiting.
                    // Counting held frames rather than wall clock means a tab
                    // left in the background does not come back to an abandoned
                    // walk — it simply resumes where it paused.
                    if (held > LOAD_TIMEOUT_MS) load.failed = true;
                }

                if (!placed && load.texture) {
                    this.beginIncoming(url, load.texture, yawOffset, direction);
                    placed = true;
                }

                const d = easeWalk(p);
                this.camera.position.copy(direction).multiplyScalar(this.travelUnits * d);
                // Field of view is deliberately steady. Changing it mid-journey
                // reads as a camera zoom, not as walking.
                this.fov = fromFov + dFov * d;
                this.applyCamera();
                this.invalidate();

                if (placed) {
                    const fadeP = clamp((p - FADE_FROM) / (FADE_TO - FADE_FROM), 0, 1);
                    this.back.material.opacity = easeInOutCubic(fadeP);
                    if (fadeP >= 1) faded = true;
                }

                if (p >= 1) return resolve(placed && faded);
                if (load.failed && !placed && p >= FADE_TO) return resolve(false);

                requestAnimationFrame(step);
            };

            requestAnimationFrame(step);
        });
    }

    /**
     * A walk carries your heading with it: the incoming panorama is NOT rotated
     * to some preferred facing, so the compass direction you were walking in is
     * the one you arrive facing.
     *
     * Every panorama in the tour comes out of the same 3D model, so a given yaw
     * means the same direction in all of them. Keeping it means the place you
     * just left is genuinely behind you when you arrive — turn around and it is
     * there. Snapping to a per-scene facing instead breaks that thread and is
     * what made arrivals feel like being dropped somewhere new rather than
     * having walked. (The original Pannellum build did the same thing, by
     * passing "same" for yaw and pitch when changing scene.)
     */
    private walkYawOffset() {
        return 0;
    }

    private beginIncoming(
        url: string,
        texture: THREE.Texture,
        yawOffset: number,
        /** Park the destination this far ahead so the camera walks into it. */
        direction?: THREE.Vector3
    ) {
        this.backUrl = url;
        this.pendingYawOffset = yawOffset;
        this.back.material.map = texture;
        this.back.material.opacity = 0;
        this.back.material.needsUpdate = true;
        this.back.rotation.y = THREE.MathUtils.degToRad(yawOffset);
        if (direction) {
            this.back.position.copy(direction).multiplyScalar(this.travelUnits);
        } else {
            this.back.position.set(0, 0, 0);
        }
        this.back.visible = true;
        this.invalidate();
    }

    /** Promote the incoming sphere to the visible one and recycle the other. */
    private commitIncoming() {
        const previous = this.front;
        this.front = this.back;
        this.back = previous;

        this.front.renderOrder = 0;
        this.front.material.opacity = 1;
        this.front.visible = true;

        this.back.renderOrder = 1;
        this.back.visible = false;
        this.back.material.map = null;
        this.back.material.needsUpdate = true;
        this.back.position.set(0, 0, 0);

        // Re-centre. The camera finished the journey at the arriving sphere's
        // centre, so shifting both back to the origin together changes nothing
        // on screen — it just restores the frame everything else assumes
        // (hotspot projection, the next journey's start point).
        this.front.position.set(0, 0, 0);
        this.camera.position.set(0, 0, 0);
        this.applyCamera();

        this.frontUrl = this.backUrl;
        this.backUrl = "";
        this.yawOffset = this.pendingYawOffset;
        this.evict();
        this.invalidate();
    }

    // ── Camera ────────────────────────────────────────────────────────────

    private lookDirection(lon: number, lat: number) {
        const phi = THREE.MathUtils.degToRad(90 - lat);
        // +180 puts yaw 0 at the CENTRE of the equirectangular image, which is
        // the convention the tour data is authored in (and the one Pannellum
        // used). Without it every scene opens facing backwards and every
        // hotspot lands on the wrong part of the panorama.
        const theta = THREE.MathUtils.degToRad(lon + 180);
        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );
    }

    private applyCamera() {
        this.orientation.lat = clamp(this.orientation.lat, -LAT_LIMIT, LAT_LIMIT);
        const target = this.lookDirection(this.orientation.lon, this.orientation.lat)
            .multiplyScalar(RADIUS)
            .add(this.camera.position);
        this.camera.lookAt(target);
        if (this.camera.fov !== this.fov) {
            this.camera.fov = this.fov;
            this.camera.updateProjectionMatrix();
        }
    }

    /** Project a scene-space direction to viewport pixels, for DOM overlays. */
    project(pitch: number, yaw: number): ScreenPoint {
        const point = this.lookDirection(yaw + this.yawOffset, pitch).multiplyScalar(RADIUS);
        const projected = point.project(this.camera);
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        return {
            x: (projected.x * 0.5 + 0.5) * width,
            y: (-projected.y * 0.5 + 0.5) * height,
            // z ≥ 1 means the point is behind the camera or past the far plane.
            visible: projected.z < 1,
        };
    }

    // ── Zoom ──────────────────────────────────────────────────────────────

    getFov() {
        return this.fov;
    }

    /** Animated zoom. The old viewers jumped the fov in one frame. */
    zoomBy(deltaFov: number, duration = 300) {
        this.setFov(this.baseFov + deltaFov, duration);
    }

    setFov(value: number, duration = 300) {
        const target = clamp(value, this.minFov, this.maxFov);
        this.baseFov = target;
        if (this.transitioning || duration <= 0) {
            this.fov = target;
            this.applyCamera();
            this.invalidate();
            return;
        }
        this.fovTween = { from: this.fov, to: target, start: performance.now(), duration };
        this.markActive();
        this.invalidate();
    }

    // ── Controls ──────────────────────────────────────────────────────────

    private attachControls() {
        const el = this.renderer.domElement;
        el.style.touchAction = "none";
        el.style.cursor = "grab";

        el.addEventListener("pointerdown", this.onPointerDown);
        el.addEventListener("pointermove", this.onPointerMove);
        el.addEventListener("pointerup", this.onPointerUp);
        el.addEventListener("pointercancel", this.onPointerUp);
        el.addEventListener("wheel", this.onWheel, { passive: false });
    }

    private detachControls() {
        const el = this.renderer.domElement;
        el.removeEventListener("pointerdown", this.onPointerDown);
        el.removeEventListener("pointermove", this.onPointerMove);
        el.removeEventListener("pointerup", this.onPointerUp);
        el.removeEventListener("pointercancel", this.onPointerUp);
        el.removeEventListener("wheel", this.onWheel);
    }

    private onPointerDown = (e: PointerEvent) => {
        this.pressAt = { x: e.clientX, y: e.clientY };
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        // Pointer capture means dragging off the canvas still tracks — without
        // it the viewer would get stuck mid-drag whenever the pointer left.
        this.renderer.domElement.setPointerCapture?.(e.pointerId);
        if (this.activePointers.size === 2) {
            this.pinchDistance = this.currentPinchDistance();
            this.dragging = false;
            return;
        }
        this.dragging = true;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        this.velocity = { lon: 0, lat: 0 };
        this.renderer.domElement.style.cursor = "grabbing";
        this.markActive();
    };

    private onPointerMove = (e: PointerEvent) => {
        // A pointer that is not pressed is just hovering the floor — that has
        // to be handled before the drag bookkeeping, which only tracks pointers
        // that went down on the canvas.
        if (!this.activePointers.has(e.pointerId)) {
            this.updateFloorHover(e);
            return;
        }
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.activePointers.size === 2) {
            const distance = this.currentPinchDistance();
            if (this.pinchDistance > 0) {
                const ratio = this.pinchDistance / distance;
                this.setFov(this.fov * ratio, 0);
            }
            this.pinchDistance = distance;
            this.markActive();
            return;
        }

        if (!this.dragging || this.transitioning) return;
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer = { x: e.clientX, y: e.clientY };

        // Scale drag by fov so zoomed-in panning is not hypersensitive.
        const speed = 0.12 * (this.fov / 75);
        const dLon = -dx * speed;
        const dLat = dy * speed;

        this.orientation.lon += dLon;
        this.orientation.lat += dLat;
        this.velocity = { lon: dLon, lat: dLat };
        this.applyCamera();
        this.markActive();
    };

    private onPointerUp = (e: PointerEvent) => {
        this.activePointers.delete(e.pointerId);
        this.renderer.domElement.releasePointerCapture?.(e.pointerId);
        if (this.activePointers.size < 2) this.pinchDistance = 0;
        if (this.activePointers.size === 0) {
            this.dragging = false;
            this.renderer.domElement.style.cursor = "grab";
        }

        // A press that barely moved is a click, not a drag.
        const press = this.pressAt;
        this.pressAt = null;
        if (press && e.type === "pointerup") {
            const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
            if (moved < 6) this.handleClick(e);
        }

        this.markActive();
    };

    private onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (this.transitioning) return;
        this.setFov(this.baseFov + Math.sign(e.deltaY) * 5, 200);
        this.markActive();
    };

    // ── Floor navigation ──────────────────────────────────────────────────

    /** Replace the navigable destinations shown on the floor. */
    setMarkers(specs: MarkerSpec[]) {
        this.floorMarkers.setMarkers(specs);
        this.floorMarkers.setVisible(!this.transitioning);
        this.invalidate();
    }

    /**
     * The destinations currently on the floor, resolved to real positions.
     *
     * Exposed so the page can draw its own DOM overlay for each one — the
     * signposted arrows the tour uses need a screen position per marker, and
     * only the engine knows where the markers ended up.
     */
    get navigationMarkers(): Marker[] {
        return this.floorMarkers.markers;
    }

    /** Screen position of a marker, for placing a DOM label over it. */
    projectMarker(marker: Marker): ScreenPoint {
        const projected = marker.position.clone().project(this.camera);
        return {
            x: (projected.x * 0.5 + 0.5) * this.container.clientWidth,
            y: (-projected.y * 0.5 + 0.5) * this.container.clientHeight,
            visible: projected.z < 1,
        };
    }

    /** Point the pointer with the camera, ready for a raycast. */
    private aimRay(e: PointerEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointerNdc.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        return this.raycaster.ray;
    }

    /**
     * Where the pointer meets the floor.
     *
     * There is no geometry in a panorama to hit, so the floor is taken to be a
     * flat plane one eye-height below the viewer — true enough for the level
     * ground these scenes are shot on. A ray aimed at or above the horizon
     * never meets it, which is exactly when the ghost ring should disappear.
     */
    private floorHit(e: PointerEvent) {
        const ray = this.aimRay(e);
        const targetY = this.camera.position.y - EYE_HEIGHT;
        if (ray.direction.y > -0.02) return null;
        const t = (targetY - ray.origin.y) / ray.direction.y;
        if (t <= 0) return null;
        const point = ray.origin.clone().addScaledVector(ray.direction, t);
        const distance = Math.hypot(point.x - this.camera.position.x, point.z - this.camera.position.z);
        // Near the horizon a floor ring flattens into an unreadable smear, so
        // past this the pointer counts as being off the floor entirely.
        if (distance > 12) return null;
        return { point, distance };
    }

    /** Bearing of a floor point, in the same yaw frame as the tour data. */
    private yawOf(point: THREE.Vector3) {
        const theta = THREE.MathUtils.radToDeg(
            Math.atan2(point.z - this.camera.position.z, point.x - this.camera.position.x)
        );
        return (((theta - 180) % 360) + 360) % 360;
    }

    private updateFloorHover(e: PointerEvent) {
        if (this.transitioning) return;

        this.aimRay(e);
        const picked = this.raycaster.intersectObjects(this.floorMarkers.pickables, false);
        const marker = picked.length ? this.floorMarkers.markerForObject(picked[0].object) : null;

        if (this.floorMarkers.setHovered(marker?.id ?? null)) {
            this.onMarkerHover?.(marker);
            this.invalidate();
        }
        this.renderer.domElement.style.cursor = marker ? "pointer" : "grab";

        const floor = marker ? null : this.floorHit(e);
        this.floorMarkers.setCursor(floor?.point ?? null, floor?.distance);
        this.invalidate();
    }

    /**
     * Clicking the floor anywhere sets off in that direction: the marker whose
     * bearing best matches the click wins. Without this you would have to hit
     * a ring exactly, which is fussy for the far ones — and it is what makes
     * the floor feel walkable rather than a set of buttons.
     */
    private handleClick(e: PointerEvent) {
        if (this.transitioning) return;

        this.aimRay(e);
        const picked = this.raycaster.intersectObjects(this.floorMarkers.pickables, false);
        if (picked.length) {
            const marker = this.floorMarkers.markerForObject(picked[0].object);
            if (marker) this.onMarkerActivate?.(marker);
            return;
        }

        const floor = this.floorHit(e);
        if (!floor) return;

        const clickYaw = this.yawOf(floor.point);
        let best: Marker | null = null;
        let bestSpread = Infinity;
        for (const marker of this.floorMarkers.markers) {
            const spread = Math.abs(shortestDelta(clickYaw, marker.yaw));
            if (spread < bestSpread) {
                bestSpread = spread;
                best = marker;
            }
        }
        // Only follow a click that genuinely points at somewhere you can go.
        if (best && bestSpread <= 32) this.onMarkerActivate?.(best);
    }

    private currentPinchDistance() {
        const [a, b] = Array.from(this.activePointers.values());
        if (!a || !b) return 0;
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    /** Register interaction: suspends auto-rotation and keeps rendering. */
    markActive() {
        this.idleSince = performance.now();
        this.invalidate();
    }

    setAutoRotate(enabled: boolean) {
        this.autoRotateEnabled = enabled && this.autoRotateSpeed !== 0;
        this.invalidate();
    }

    // ── Render loop ───────────────────────────────────────────────────────

    /** Request a frame. The loop renders only when something has changed. */
    invalidate() {
        this.dirty = true;
    }

    private loop = () => {
        if (this.disposed) return;
        this.rafId = requestAnimationFrame(this.loop);

        const now = performance.now();
        const delta = this.lastFrame ? Math.min(now - this.lastFrame, 100) : 16;
        this.lastFrame = now;

        // Inertia — the old viewer stopped dead the instant you let go.
        if (!this.dragging && !this.transitioning) {
            const speed = Math.abs(this.velocity.lon) + Math.abs(this.velocity.lat);
            if (speed > 0.001) {
                this.orientation.lon += this.velocity.lon;
                this.orientation.lat += this.velocity.lat;
                const decay = Math.pow(0.94, delta / 16.67);
                this.velocity.lon *= decay;
                this.velocity.lat *= decay;
                if (Math.abs(this.velocity.lon) + Math.abs(this.velocity.lat) < 0.001) {
                    this.velocity = { lon: 0, lat: 0 };
                }
                this.applyCamera();
                this.dirty = true;
            }
        }

        if (this.fovTween) {
            const { from, to, start, duration } = this.fovTween;
            const p = clamp((now - start) / duration, 0, 1);
            this.fov = from + (to - from) * easeInOutCubic(p);
            if (p >= 1) this.fovTween = null;
            this.applyCamera();
            this.dirty = true;
        }

        // Idle auto-rotation, in deg/sec — the previous viewers advanced by a
        // fixed amount per frame, so they drifted 2.4× faster on a 144 Hz panel.
        if (
            this.autoRotateEnabled &&
            !this.dragging &&
            !this.transitioning &&
            now - this.idleSince > this.autoRotateDelay
        ) {
            this.orientation.lon += (this.autoRotateSpeed * delta) / 1000;
            this.applyCamera();
            this.dirty = true;
        }

        if (this.floorMarkers.update(delta)) this.dirty = true;

        if (!this.dirty) return;
        this.dirty = false;
        this.renderer.render(this.scene, this.camera);
        this.onFrame?.();
    };

    /** Promise-based tween driven by the shared clock. */
    private tween(duration: number, onUpdate: (p: number) => void) {
        return new Promise<void>((resolve) => {
            if (duration <= 0 || this.disposed) {
                onUpdate(1);
                this.invalidate();
                return resolve();
            }
            const start = performance.now();
            const step = () => {
                if (this.disposed) return resolve();
                const p = clamp((performance.now() - start) / duration, 0, 1);
                onUpdate(p);
                this.invalidate();
                if (p >= 1) return resolve();
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }

    // ── Teardown ──────────────────────────────────────────────────────────

    get isTransitioning() {
        return this.transitioning;
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        cancelAnimationFrame(this.rafId);
        this.detachControls();
        this.resizeObserver?.disconnect();
        this.removeWindowResize?.();

        this.floorMarkers.dispose();
        this.scene.remove(this.front, this.back);
        this.front.material.dispose();
        this.back.material.dispose();
        this.geometry.dispose();
        this.textures.forEach((texture) => texture.dispose());
        this.textures.clear();
        this.inFlight.clear();

        this.renderer.dispose();
        const canvas = this.renderer.domElement;
        if (canvas.parentNode === this.container) this.container.removeChild(canvas);
    }
}

export type { Hotspot, Orientation };
