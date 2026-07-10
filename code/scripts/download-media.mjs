// Offline media downloader.
// Reads the captured API snapshots (scripts/snapshots/*.json), downloads every
// Cloudinary media file into public/media/<group>/, and writes rewritten JSON
// (URLs -> local relative "media/<group>/<file>" paths) into src/data/offline/.
// Run once at build time (needs internet): node scripts/download-media.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SNAP = path.join(ROOT, 'scripts', 'snapshots');
const MEDIA = path.join(ROOT, 'public', 'media');
const OUT = path.join(ROOT, 'src', 'data', 'offline');

// snapshot file -> { outKey (offline json name), folder (public/media subfolder) }
const GROUPS = {
  'floors.json':    { key: 'floors',    folder: 'floors' },
  'amenities.json': { key: 'amenities', folder: 'amenities' },
  'gallery.json':   { key: 'gallery',   folder: 'gallery' },
  'mobility.json':  { key: 'mobility',  folder: 'mobility' },
  'transport.json': { key: 'transport', folder: 'transport' },
  'vr-tour.json':   { key: 'vrTour',    folder: 'vr' },
};

// hardcoded cloudinary URLs referenced directly in component code (not in API JSON)
const EXTRAS = [
  { folder: 'home',      url: 'https://res.cloudinary.com/db0f2ofgf/image/upload/v1779280128/C02_2.jpg_vcclaz.jpg' },
  { folder: 'home',      url: 'https://res.cloudinary.com/db0f2ofgf/image/upload/v1779280182/day_x1f_cwkyrz.png' },
  { folder: 'amenities', url: 'https://res.cloudinary.com/db0f2ofgf/image/upload/v1779279989/cam_4_2_igzh94.png' },
];

// Match the FULL cloudinary URL up to a delimiter (quote/space/paren/backslash).
// Do NOT anchor on extension: some filenames contain a mid-string ".jpg_" double
// extension (e.g. zoneing.jpg_rzzgky.jpg) which a non-greedy .ext match truncates.
const CLOUD_RE = /https?:\/\/res\.cloudinary\.com\/[^\s"'\\)]+/gi;

const fnameFromUrl = (url) => decodeURIComponent(url.split('?')[0].split('/').pop());

async function download(url, dest) {
  if (existsSync(dest)) return 'cached';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return `${(buf.length / 1048576).toFixed(1)}MB`;
}

async function pool(items, size, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx).catch((e) => ({ error: e.message }));
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let ok = 0, cached = 0, failed = 0, total = 0;
  const fail = [];

  // 1) per-endpoint snapshots: collect + rewrite + download
  const jobs = []; // {url, dest}
  for (const [file, { key, folder }] of Object.entries(GROUPS)) {
    const raw = await readFile(path.join(SNAP, file), 'utf8');
    const urls = [...new Set(raw.match(CLOUD_RE) || [])];
    let rewritten = raw;
    await mkdir(path.join(MEDIA, folder), { recursive: true });
    for (const url of urls) {
      const local = `media/${folder}/${fnameFromUrl(url)}`;
      rewritten = rewritten.split(url).join(local);
      jobs.push({ url, dest: path.join(ROOT, 'public', local) });
    }
    await writeFile(path.join(OUT, `${key}.json`), rewritten);
    console.log(`rewrote ${file} -> src/data/offline/${key}.json (${urls.length} urls)`);
  }

  // 2) extras
  for (const { folder, url } of EXTRAS) {
    await mkdir(path.join(MEDIA, folder), { recursive: true });
    jobs.push({ url, dest: path.join(MEDIA, folder, fnameFromUrl(url)) });
  }

  // de-dupe by dest
  const seen = new Set();
  const uniq = jobs.filter((j) => (seen.has(j.dest) ? false : seen.add(j.dest)));
  total = uniq.length;
  console.log(`\nDownloading ${total} media files...\n`);

  await pool(uniq, 8, async (j) => {
    try {
      const r = await download(j.url, j.dest);
      if (r === 'cached') { cached++; }
      else { ok++; console.log(`  ok   ${fnameFromUrl(j.url)} (${r})`); }
      return r;
    } catch (e) {
      failed++; fail.push(`${j.url} :: ${e.message}`); console.log(`  FAIL ${fnameFromUrl(j.url)}`);
      return { error: e.message };
    }
  });

  console.log(`\nDone. downloaded=${ok} cached=${cached} failed=${failed} total=${total}`);
  if (fail.length) { console.log('\nFAILURES:'); fail.forEach((f) => console.log('  ' + f)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
