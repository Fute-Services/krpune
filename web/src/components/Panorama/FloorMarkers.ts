import * as THREE from "three";

/**
 * Navigation markers that lie flat on the floor, the way Matterport's do.
 *
 * The important part is that these are real 3D objects sitting in the floor
 * plane, not sprites facing the camera. Perspective then squashes each ring
 * into an ellipse and shrinks the far ones on its own, so they read as points
 * ON the ground rather than stickers floating in front of it — and a set of
 * destinations that used to pile up in the middle of the screen now spreads
 * out into a trail leading away from you.
 */

/**
 * Viewer eye height in metres. The panoramas were rendered from roughly
 * standing height, and this is what turns a hotspot's downward angle into a
 * distance across the floor: a marker `d` metres away sits at a pitch of
 * −atan(EYE_HEIGHT / d).
 */
export const EYE_HEIGHT = 1.6;

/** Ring sizes in metres, chosen to sit close to Matterport's own proportions. */
const CORE_INNER = 0.22;
const CORE_OUTER = 0.34;
const HALO_INNER = 0.54;
const HALO_OUTER = 0.6;
/** Generous invisible disc so the rings are easy to hit, especially far ones. */
const HIT_RADIUS = 0.75;

/**
 * Markers are kept within this band, in metres.
 *
 * The tour data's downward angles were eyeballed to place arrows, not measured,
 * and a shallow one implies a distance far enough that a ring on the floor
 * flattens into an unreadable sliver near the horizon. Clamping keeps every
 * marker in the range where a floor ring still looks like a ring, at the cost
 * of a couple of degrees' drift from where the angle literally points.
 */
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 6;

/**
 * Distance a ring is drawn at "true" size. Nearer and farther ones are scaled
 * part-way back towards it, so perspective still reads but the far markers
 * never shrink out of sight or out of reach of the pointer.
 */
const REFERENCE_DISTANCE = 4;
const DISTANCE_COMPENSATION = 0.65;

const IDLE_OPACITY = 0.75;
const HOVER_OPACITY = 1;
/** Ghost ring that follows the pointer across the floor. */
const CURSOR_OPACITY = 0.4;

/** How quickly hover states catch up, per millisecond. */
const HOVER_LERP = 0.012;

export interface MarkerSpec {
    id: string;
    /** Degrees around the horizon. */
    yaw: number;
    /** Degrees below the horizon (negative). */
    pitch: number;
    label?: string;
}

export interface Marker extends MarkerSpec {
    /** Distance across the floor, in metres. */
    distance: number;
    /** Position in the floor plane. */
    position: THREE.Vector3;
}

interface MarkerNode {
    marker: Marker;
    group: THREE.Group;
    core: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    hit: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
    /** 0 = idle, 1 = fully hovered. Eased towards `hoverTarget`. */
    hover: number;
    hoverTarget: number;
}

const flatRing = (inner: number, outer: number) => {
    const geometry = new THREE.RingGeometry(inner, outer, 64);
    // Rings are born standing up in the XY plane; lay them down on the floor.
    geometry.rotateX(-Math.PI / 2);
    return geometry;
};

export default class FloorMarkers {
    readonly group = new THREE.Group();

    private readonly coreGeometry = flatRing(CORE_INNER, CORE_OUTER);
    private readonly haloGeometry = flatRing(HALO_INNER, HALO_OUTER);
    private readonly hitGeometry = (() => {
        const g = new THREE.CircleGeometry(HIT_RADIUS, 32);
        g.rotateX(-Math.PI / 2);
        return g;
    })();

    private nodes: MarkerNode[] = [];
    private hovered: string | null = null;

    /** When false only the invisible hit discs remain — see setRingsVisible. */
    private ringsVisible = true;

    /** The ring that tracks the pointer across the floor. */
    private readonly cursor: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;

    constructor(
        parent: THREE.Object3D,
        /** Turns a yaw into a horizontal unit vector in world space. */
        private readonly headingToVector: (yaw: number) => THREE.Vector3
    ) {
        // Always drawn over the panorama; the sphere carries no depth of its own.
        this.group.renderOrder = 10;
        parent.add(this.group);

        this.cursor = new THREE.Mesh(
            flatRing(CORE_INNER * 0.9, CORE_OUTER * 0.9),
            this.ringMaterial(CURSOR_OPACITY)
        );
        this.cursor.renderOrder = 9;
        this.cursor.visible = false;
        this.group.add(this.cursor);
    }

    private ringMaterial(opacity: number) {
        return new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
    }

    /** Where a marker sits on the floor, given its bearing and downward angle. */
    private floorPosition(yaw: number, pitch: number) {
        const distance = this.distanceForPitch(pitch);
        const heading = this.headingToVector(yaw);
        return {
            distance,
            position: new THREE.Vector3(
                heading.x * distance,
                -EYE_HEIGHT,
                heading.z * distance
            ),
        };
    }

    /**
     * A hotspot's downward angle is the only distance cue the tour data holds.
     * Angles at or above the horizon would put the marker infinitely far away,
     * so those are pinned to a sensible distance instead.
     */
    private distanceForPitch(pitch: number) {
        const down = Math.max(2, -pitch);
        return clamp(
            EYE_HEIGHT / Math.tan(THREE.MathUtils.degToRad(down)),
            MIN_DISTANCE,
            MAX_DISTANCE
        );
    }

    /** Keeps far rings legible without flattening the perspective entirely. */
    private scaleForDistance(distance: number) {
        return Math.pow(distance / REFERENCE_DISTANCE, DISTANCE_COMPENSATION);
    }

    setMarkers(specs: MarkerSpec[]) {
        this.clearNodes();
        this.hovered = null;

        this.nodes = specs.map((spec) => {
            const { distance, position } = this.floorPosition(spec.yaw, spec.pitch);

            const group = new THREE.Group();
            group.position.copy(position);
            group.scale.setScalar(this.scaleForDistance(distance));

            const core = new THREE.Mesh(this.coreGeometry, this.ringMaterial(IDLE_OPACITY));
            core.renderOrder = 11;
            // Every scene change rebuilds these, so the flag has to be applied
            // here too — otherwise the rings reappear on the next panorama.
            core.visible = this.ringsVisible;

            const halo = new THREE.Mesh(this.haloGeometry, this.ringMaterial(0));
            halo.renderOrder = 11;
            halo.visible = this.ringsVisible;

            const hit = new THREE.Mesh(
                this.hitGeometry,
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthTest: false,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                })
            );
            hit.renderOrder = 11;

            group.add(core, halo, hit);
            this.group.add(group);

            return {
                marker: { ...spec, distance, position },
                group,
                core,
                halo,
                hit,
                hover: 0,
                hoverTarget: 0,
            };
        });
    }

    get markers(): Marker[] {
        return this.nodes.map((n) => n.marker);
    }

    /** Objects a raycaster should test against. */
    get pickables() {
        return this.nodes.map((n) => n.hit);
    }

    markerForObject(object: THREE.Object3D): Marker | null {
        return this.nodes.find((n) => n.hit === object)?.marker ?? null;
    }

    setHovered(id: string | null) {
        if (this.hovered === id) return false;
        this.hovered = id;
        this.nodes.forEach((n) => {
            n.hoverTarget = n.marker.id === id ? 1 : 0;
        });
        return true;
    }

    get hoveredMarker(): Marker | null {
        return this.nodes.find((n) => n.marker.id === this.hovered)?.marker ?? null;
    }

    /**
     * Draw the rings, or leave only their invisible hit discs behind.
     *
     * The VR tour turns them off: it signposts destinations with the arrow
     * markers instead, and a ring under every arrow just added a second thing
     * to look at. The hit discs stay either way, so the floor around an arrow
     * remains a generous touch target and hover still resolves.
     */
    setRingsVisible(visible: boolean) {
        this.ringsVisible = visible;
        for (const node of this.nodes) {
            node.core.visible = visible;
            node.halo.visible = visible;
        }
        if (!visible) this.cursor.visible = false;
    }

    /** Park the ghost ring on the floor, or hide it when off the floor. */
    setCursor(point: THREE.Vector3 | null, distance = REFERENCE_DISTANCE) {
        if (!this.ringsVisible || !point || this.hovered) {
            this.cursor.visible = false;
            return;
        }
        this.cursor.visible = true;
        this.cursor.position.copy(point);
        this.cursor.scale.setScalar(this.scaleForDistance(distance));
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
        if (!visible) this.cursor.visible = false;
    }

    /** Ease hover states. Returns true while anything is still moving. */
    update(delta: number) {
        let animating = false;
        const step = clamp(delta * HOVER_LERP, 0, 1);

        for (const node of this.nodes) {
            if (Math.abs(node.hover - node.hoverTarget) > 0.001) {
                node.hover += (node.hoverTarget - node.hover) * step;
                animating = true;
            } else {
                node.hover = node.hoverTarget;
            }

            const h = node.hover;
            // Idle rings are a soft white; hovering brings them to full white
            // and opens a wider ring around them.
            node.core.material.opacity = IDLE_OPACITY + (HOVER_OPACITY - IDLE_OPACITY) * h;
            node.core.scale.setScalar(1 + 0.18 * h);
            node.halo.material.opacity = HOVER_OPACITY * h;
            node.halo.scale.setScalar(0.86 + 0.14 * h);
        }

        return animating;
    }

    private clearNodes() {
        for (const node of this.nodes) {
            this.group.remove(node.group);
            node.core.material.dispose();
            node.halo.material.dispose();
            node.hit.material.dispose();
        }
        this.nodes = [];
    }

    dispose() {
        this.clearNodes();
        this.cursor.material.dispose();
        this.group.parent?.remove(this.group);
        this.coreGeometry.dispose();
        this.haloGeometry.dispose();
        this.hitGeometry.dispose();
    }
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
