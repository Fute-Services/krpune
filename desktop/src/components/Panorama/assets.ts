/**
 * Optional panorama variants.
 *
 * `scripts/optimize-panoramas.mjs` can generate JPEG siblings for the heavy
 * PNGs and tiny blurred previews, writing `media/panorama-manifest.json`
 * alongside them. That script is opt-in and never touches the originals, so
 * everything here degrades to "just use the original file" when it has not
 * been run — which is the state the repo ships in.
 */

interface ManifestEntry {
    /** Optimized full-resolution file, if one was generated. */
    full?: string;
    /** ~1024×512 blurred stand-in shown while the full image decodes. */
    preview?: string;
}

type Manifest = Record<string, ManifestEntry>;

let manifest: Manifest | null = null;
let loading: Promise<Manifest> | null = null;

const base = () => import.meta.env.BASE_URL;

/** Load the variant manifest once. A missing manifest is the normal case. */
export function loadManifest(): Promise<Manifest> {
    if (manifest) return Promise.resolve(manifest);
    if (loading) return loading;

    loading = fetch(base() + "media/panorama-manifest.json")
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
        .then((data: Manifest) => {
            manifest = data && typeof data === "object" ? data : {};
            return manifest;
        });

    return loading;
}

/** Strip the base URL so a manifest keyed by repo-relative paths still matches. */
const normalize = (url: string) => {
    const prefix = base();
    return url.startsWith(prefix) ? url.slice(prefix.length) : url;
};

export interface PanoramaSource {
    /** URL to render at full quality. */
    full: string;
    /** URL of a cheap stand-in to show first, if one exists. */
    preview?: string;
}

/**
 * Resolve a panorama path to the best available variants. Safe to call before
 * the manifest has loaded — it simply returns the original until then.
 */
export function resolveSource(url: string): PanoramaSource {
    const entry = manifest?.[normalize(url)];
    if (!entry) return { full: url };
    return {
        full: entry.full ? base() + entry.full : url,
        preview: entry.preview ? base() + entry.preview : undefined,
    };
}
