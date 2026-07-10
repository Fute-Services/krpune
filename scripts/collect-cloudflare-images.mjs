import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'cloudflare-images');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif']);

// Excluded (unused) files, from UNUSED_ASSETS.md — kept out of the Cloudflare folder.
const EXCLUDED = new Set(
  [
    'public/VR/arrow.png',
    'public/VR/arrowfinal1.png',
    'public/VR/arrowfinal2.png',
    'public/VR/dropoff.jpeg',
    'public/VR/entrygate.jpeg',
    'public/VR/leftlobby.jpeg',
    'public/VR/Podium1.jpeg',
    'public/VR/Podium2.jpeg',
    'public/VR/reception.jpeg',
    'public/VR/retail.jpeg',
    'public/VR/retailold.jpeg',
    'public/VR/terrace.jpeg',
    'public/VR/terrace_sports.jpeg',
    'public/VR/terrace1.jpeg',
    'public/VR/terrace2.jpeg',
    'public/VR/uparrow.svg',
    'public/vrs/drop_off.jpeg',
    'public/vrs/entry_gate.jpeg',
    'public/vrs/lift_lobby.jpeg',
    'public/vrs/podium_1.jpeg',
    'public/vrs/podium_2.jpeg',
    'public/vrs/reception_lobby.jpeg',
    'public/vrs/retail_and_amenities.jpeg',
    'public/vrs/terrace_amenities.jpeg',
    'public/vrs/terrace_multi_purpose_court.jpeg',
    'src/assets/About-us.jpg',
    'src/assets/amenities/Aminities.png',
    'src/assets/amenities/GroundLevel.png',
    'src/assets/amenities/secondimage1.png',
    'src/assets/amenitites-logo.svg',
    'src/assets/building.jpeg',
    'src/assets/gallery/10.png',
    'src/assets/gallery/8.png',
    'src/assets/home-logo.svg',
    'src/assets/location-logo.svg',
    'src/assets/location-map.jpeg',
    'src/assets/map.jpeg',
    'src/assets/metrics.png',
    'src/assets/project_details/bgUnit1.jpg',
    'src/assets/project_details/inventorybg.png',
    'src/assets/project_details/parking1-2d.png',
    'src/assets/project_details/parking1-3d.png',
    'src/assets/project_details/parking2-2d.png',
    'src/assets/project_details/parking2-3d.png',
    'src/assets/project_details/parking3-2d.png',
    'src/assets/project_details/parking3-3d.png',
    'src/assets/project_details/parking4-2d.png',
    'src/assets/project_details/parking4-3d.png',
    'src/assets/project_details/parking5-2d.png',
    'src/assets/project_details/parking5-3d.png',
    'src/assets/project_details/parking6-2d.png',
    'src/assets/project_details/parking6-3d.png',
    'src/assets/project_details/podium3d.png',
    'src/assets/project_details/Sky_Background.jpg',
    'src/assets/project_details/TowerImage.jpeg',
    'src/assets/project_details/unitImagenew2D.png',
    'src/assets/project-details-logo.svg',
    'src/assets/unit/bgunit.png',
    'src/assets/unit/flor1to17.png',
    'src/assets/unit/project details (about us ).jpg',
    'src/assets/vr-logo.svg',
    'src/assets/zoom-in (2).png',
    'src/assets/zoom-in.png',
    'src/assets/zoom-out.jpg',
  ].map((p) => p.replace(/\\/g, '/').toLowerCase())
);

const INCLUDE_ROOTS = ['public/media', 'src/assets'];
const INCLUDE_FILES = ['public/logo.png', 'public/VR/arrowfinal.png'];

let copied = 0;
let skipped = 0;

function walk(relDir) {
  const absDir = path.join(root, relDir);
  if (!fs.existsSync(absDir)) return;
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const relPath = path.join(relDir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(relPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      if (EXCLUDED.has(relPath.toLowerCase())) {
        skipped++;
        continue;
      }
      copyFile(relPath);
    }
  }
}

function copyFile(relPath) {
  const src = path.join(root, relPath);
  const dest = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const f of INCLUDE_FILES) {
  if (fs.existsSync(path.join(root, f))) copyFile(f);
  else console.warn('Missing expected file:', f);
}

for (const dir of INCLUDE_ROOTS) {
  walk(dir);
}

console.log(`Copied ${copied} images to ${outDir}`);
console.log(`Skipped ${skipped} known-unused images`);
