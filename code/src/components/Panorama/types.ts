/**
 * Shared types for the panorama engine used by the VR tour (/vr) and the
 * amenities viewers (/ground-level, /podium-level, /terrace-level,
 * /lobby-reception).
 */

/** A navigation arrow placed on the panorama sphere. */
export interface Hotspot {
    /** Degrees above (+) / below (−) the horizon. */
    pitch: number;
    /** Degrees around the horizon. */
    yaw: number;
    /** Label shown on hover. */
    text?: string;
    /** Scene id this arrow walks to. */
    next: string;
    /** CSS rotation (deg) applied to the arrow sprite. */
    rotation?: number;
}

/** One panorama location in the tour. */
export interface PanoramaScene {
    id: string;
    /** Fully resolved image URL. */
    url: string;
    /** Initial camera yaw when the scene opens. */
    yaw?: number;
    /** Initial camera pitch when the scene opens. */
    pitch?: number;
    hotSpots?: Hotspot[];
}

/** Camera orientation, in degrees. */
export interface Orientation {
    /** Around the horizon. */
    lon: number;
    /** Above/below the horizon, clamped to ±85. */
    lat: number;
}

export interface EngineOptions {
    /** Vertical field of view the camera rests at. */
    fov?: number;
    /** Zoom limits (vertical fov, degrees). */
    minFov?: number;
    maxFov?: number;
    /** Idle auto-rotation speed in deg/sec. 0 disables it. */
    autoRotateSpeed?: number;
    /** How long the viewer must sit idle before auto-rotation resumes (ms). */
    autoRotateDelay?: number;
    /**
     * How many decoded textures to keep on the GPU. A 6000×3000 panorama is
     * ~72 MB of VRAM (~96 MB with mipmaps), so this cap is what stops the tour
     * from exhausting GPU memory on integrated/kiosk hardware.
     */
    textureCacheSize?: number;
}
