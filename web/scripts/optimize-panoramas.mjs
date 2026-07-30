#!/usr/bin/env node
/**
 * Generate optional panorama variants: JPEG versions of the heavy PNGs, and a
 * small blurred preview for every panorama.
 *
 * This is opt-in (`npm run panos:optimize`) and NOT part of the build. It never
 * reads-modifies-writes an original: everything it produces lands in
 * `public/media/optimized/` and `public/media/previews/`, and the app falls
 * back to the originals whenever a variant is absent. Deleting those two
 * folders plus the manifest fully reverts it.
 *
 * Requires sharp:  npm i -D sharp
 */

import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = path.join(root, "public", "media");

/** Folders holding equirectangular panoramas, relative to public/media. */
const SOURCE_DIRS = ["vr", "amenities"];

const OPTIMIZED_DIR = "optimized";
const PREVIEWS_DIR = "previews";

const PREVIEW_WIDTH = 1024;
const PREVIEW_HEIGHT = 512;
const PREVIEW_QUALITY = 70;
const PREVIEW_BLUR = 1.2;
const FULL_QUALITY = 88;

/**
 * Equirectangular panoramas are shipped at 6000×3000, which is the wrong size
 * for two separate reasons:
 *
 *  - 4096 is the maximum texture dimension guaranteed by WebGL, and it is the
 *    real limit on older iPads. Anything wider is either rejected or silently
 *    rescaled by the driver, so those extra pixels are decoded and thrown away.
 *  - 18 megapixels of JPEG blocks the main thread for seconds on a tablet. That
 *    stall *is* the black screen when the tour opens; nothing else is wrong.
 *
 * 4096×2048 is 2.15× fewer pixels and looks identical at the field of view this
 * tour uses. Originals are never modified — these are siblings.
 */
const FULL_MAX_WIDTH = 4096;
const FULL_MAX_HEIGHT = 2048;

let sharp;
try {
    ({ default: sharp } = await import("sharp"));
} catch {
    console.error(
        "\n  sharp is not installed. Run:  npm i -D sharp\n" +
            "  (it is only needed for this script, not for the app)\n"
    );
    process.exit(1);
}

const isImage = (name) => /\.(png|jpe?g)$/i.test(name);
const toPosix = (p) => p.split(path.sep).join("/");
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const manifest = {};
let generated = 0;
let skipped = 0;

for (const dir of SOURCE_DIRS) {
    const sourceDir = path.join(mediaDir, dir);
    if (!existsSync(sourceDir)) {
        console.log(`  · skipping media/${dir} (not present)`);
        continue;
    }

    await mkdir(path.join(mediaDir, OPTIMIZED_DIR, dir), { recursive: true });
    await mkdir(path.join(mediaDir, PREVIEWS_DIR, dir), { recursive: true });

    const files = (await readdir(sourceDir)).filter(isImage);

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const key = toPosix(path.join("media", dir, file));
        const base = file.replace(/\.[^.]+$/, "");
        const entry = {};

        const metadata = await sharp(sourcePath).metadata();
        // Panoramas are wide; the odd non-panorama file that shares these
        // folders (page backgrounds, for instance) is left alone.
        const isPanorama = metadata.width >= 2 * metadata.height * 0.85;

        // ── The full-quality sibling the viewer actually loads ──
        // Produced for every panorama, not just the PNGs: the JPEGs are the
        // ones causing the stall, because they are 6000×3000 too.
        const needsResize =
            metadata.width > FULL_MAX_WIDTH || metadata.height > FULL_MAX_HEIGHT;
        if (isPanorama && (needsResize || /\.png$/i.test(file))) {
            const outRel = toPosix(path.join("media", OPTIMIZED_DIR, dir, `${base}.jpg`));
            const outPath = path.join(root, "public", outRel);
            const pipeline = sharp(sourcePath);
            if (needsResize) {
                pipeline.resize(FULL_MAX_WIDTH, FULL_MAX_HEIGHT, {
                    fit: "fill", // equirectangular: the 2:1 ratio must be preserved exactly
                    kernel: "lanczos3",
                });
            }
            await pipeline
                .jpeg({ quality: FULL_QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
                .toFile(outPath);
            entry.full = outRel;
            const [before, after] = await Promise.all([stat(sourcePath), stat(outPath)]);
            console.log(
                `  ✓ ${key}  ${metadata.width}×${metadata.height} ${kb(before.size)}` +
                    ` → ${needsResize ? `${FULL_MAX_WIDTH}×${FULL_MAX_HEIGHT}` : "same"} ${kb(after.size)}`
            );
            generated++;
        }

        // ── Blurred stand-in shown while the full image decodes ──
        if (isPanorama) {
            const previewRel = toPosix(path.join("media", PREVIEWS_DIR, dir, `${base}.jpg`));
            const previewPath = path.join(root, "public", previewRel);
            await sharp(sourcePath)
                .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, { fit: "fill" })
                .blur(PREVIEW_BLUR)
                .jpeg({ quality: PREVIEW_QUALITY })
                .toFile(previewPath);
            entry.preview = previewRel;
            generated++;
        } else {
            skipped++;
        }

        if (Object.keys(entry).length) manifest[key] = entry;
    }
}

const manifestPath = path.join(mediaDir, "panorama-manifest.json");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
    `\n  Wrote ${generated} file(s) and ${toPosix(path.relative(root, manifestPath))}.` +
        (skipped ? `  ${skipped} non-panorama image(s) left as-is.` : "") +
        "\n  Originals untouched — delete media/optimized, media/previews and the" +
        "\n  manifest to revert.\n"
);
