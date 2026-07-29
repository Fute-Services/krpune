/**
 * Builds src/offline/mediaManifest.json — the list of large runtime assets that
 * startOfflineDownload() pulls into the cache after login.
 *
 * Why this exists rather than a precache glob:
 *
 *  - Precache install is all-or-nothing (rule 10). public/media is ~500 MB; one
 *    failed entry would mean *nothing* caches. So the shell precaches and this
 *    list is fetched at runtime, one file at a time, with progress and retries.
 *  - Never cache unreferenced files (rule 11). We only emit media that is
 *    actually referenced from src/data/offline/*.json or from source code, and
 *    we print what was skipped instead of silently dropping it.
 *
 * Run via `npm run offline:manifest` (also wired as a prebuild step).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mediaDir = join(root, 'public', 'media');
const outFile = join(root, 'src', 'offline', 'mediaManifest.json');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function collectSourceText() {
  const exts = new Set(['.ts', '.tsx', '.json', '.js', '.jsx', '.css', '.html']);
  const skip = new Set(['node_modules', 'dist', 'public', '.media-originals', 'tests']);
  const files = [];
  (function rec(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) rec(full);
      else if ([...exts].some((e) => entry.name.endsWith(e))) files.push(full);
    }
  })(root);
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

const allMedia = walk(mediaDir)
  // Windows/editor junk must never reach the manifest — a 404 on Thumbs.db
  // would count as a failed download and scare the user for no reason.
  .filter((f) => !/(^|[\\/])(Thumbs\.db|\.DS_Store)$/i.test(f));

const haystack = collectSourceText();

const referenced = [];
const unreferenced = [];

for (const file of allMedia) {
  // Always emit a root-relative URL (rule 5). A relative "./media/x" would
  // resolve against the current route and 404 on nested paths.
  const url = '/' + relative(join(root, 'public'), file).split(/[\\/]/).join('/');
  const bare = url.slice(1); // "media/..." — how the offline JSON writes them
  if (haystack.includes(bare)) {
    referenced.push({ url, bytes: statSync(file).size });
  } else {
    unreferenced.push(url);
  }
}

referenced.sort((a, b) => a.url.localeCompare(b.url));

const totalBytes = referenced.reduce((sum, e) => sum + e.bytes, 0);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify({ generatedFrom: 'public/media', totalBytes, files: referenced }, null, 2) + '\n',
);

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`[offline-manifest] ${referenced.length} referenced files, ${mb(totalBytes)} MB`);
if (unreferenced.length) {
  // Rule: no silent caps. If we drop something, say which.
  console.log(`[offline-manifest] skipped ${unreferenced.length} unreferenced file(s):`);
  for (const u of unreferenced) console.log(`  - ${u}`);
}
