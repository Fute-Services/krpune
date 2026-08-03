#!/usr/bin/env node
/**
 * Regenerate the PWA / Home Screen icons in public/icons.
 *
 * Every icon shipped here used to be RGBA with a fully transparent surround,
 * which reads fine in a browser tab and wrong on a device:
 *
 *  - iOS composites an `apple-touch-icon`'s transparency onto BLACK, not onto
 *    the theme colour. The Home Screen icon came out as the logo card on a
 *    black tile, next to a splash screen that is navy.
 *  - Android masks a `purpose: "maskable"` icon into the launcher's shape and
 *    fills whatever is outside the artwork with a system plate, so a
 *    transparent maskable icon is at the launcher's mercy — and the artwork
 *    here reaches the edges, so a circular mask clips into the logo.
 *
 * So: flatten everything onto the brand navy the manifest and the launch
 * background already use, and give the maskable variant enough margin to
 * survive the mask.
 *
 * Opt-in, not part of the build: `npm run icons:generate`. It reads
 * public/icons/pwa-512.png, writes all four icons back, and is safe to re-run —
 * the artwork is located by trimming the uniform border, which gives the same
 * result whether that border is transparent (before) or navy (after).
 *
 * Requires sharp (already a devDependency).
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = path.join(root, 'public', 'icons');

/** Matches manifest background_color / theme_color and index.html's launch background. */
const BACKGROUND = { r: 0x05, g: 0x10, b: 0x1f, alpha: 1 };

/** The composition the icons already had — artwork out to the edge. */
const SOURCE = 'pwa-512.png';

/**
 * Fraction of the icon the artwork may occupy on the maskable variant.
 *
 * The maskable safe zone is the centred circle of 80 % diameter, so a square
 * that fits inside it is 80/sqrt(2) = 56 % of the icon. 55 % keeps a hair of
 * margin, and Android draws the navy out to the corners at any mask shape.
 */
const MASKABLE_ARTWORK = 0.55;

/** [file, size] — names are fixed: vite.config.ts's manifest and index.html point at them. */
const FLAT_ICONS = [
  ['apple-touch-icon.png', 180],
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
];

const source = await readFile(path.join(iconsDir, SOURCE));

// Read once, up front: pwa-512.png is one of the outputs.
for (const [name, size] of FLAT_ICONS) {
  const png = await sharp(source)
    .resize(size, size, { fit: 'contain', background: BACKGROUND })
    .flatten({ background: BACKGROUND })
    .png()
    .toBuffer();
  await writeFile(path.join(iconsDir, name), png);
  console.log(`  ${name.padEnd(24)} ${size}x${size} on #05101f`);
}

// Maskable: same artwork, pulled in far enough that a circular mask cannot
// reach it. `trim` finds the logo card inside whatever border the source has.
const artworkSize = Math.round(512 * MASKABLE_ARTWORK);
const artwork = await sharp(source)
  .trim({ threshold: 1 })
  .resize(artworkSize, artworkSize, { fit: 'contain', background: { ...BACKGROUND, alpha: 0 } })
  .png()
  .toBuffer();

const maskable = await sharp({
  create: { width: 512, height: 512, channels: 4, background: BACKGROUND },
})
  .composite([{ input: artwork, gravity: 'centre' }])
  .flatten({ background: BACKGROUND })
  // flatten() alone leaves the channel the canvas was created with, so the file
  // would still be RGBA — opaque, but indistinguishable from the bug at a
  // glance. Dropping the channel is what lets verify-build check this from the
  // PNG header without decoding pixels.
  .removeAlpha()
  .png()
  .toBuffer();
await writeFile(path.join(iconsDir, 'pwa-512-maskable.png'), maskable);
console.log(`  ${'pwa-512-maskable.png'.padEnd(24)} 512x512 on #05101f, artwork at ${Math.round(MASKABLE_ARTWORK * 100)}%`);

// An icon that is still translucent anywhere is the bug this script exists to
// fix, so prove it rather than assuming the pipeline did what it was told.
for (const name of [...FLAT_ICONS.map(([file]) => file), 'pwa-512-maskable.png']) {
  const stats = await sharp(path.join(iconsDir, name)).stats();
  if (!stats.isOpaque) throw new Error(`${name} is still not opaque`);
}
console.log('all icons opaque');
