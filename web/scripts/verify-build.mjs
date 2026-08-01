/**
 * Post-build assertions on dist/. Every check here corresponds to a failure
 * that looked fine in the source and only showed up with the network off.
 *
 * Run after `npm run build` (always against a fresh dist — rule 33).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  ${msg}`);
};
const pass = (msg) => console.log(`  ok    ${msg}`);

if (!existsSync(dist)) {
  console.error('dist/ does not exist — run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const distFiles = walk(dist).map((f) => '/' + relative(dist, f).split(/[\\/]/).join('/'));

// ─── 1. No bundler-split worker (rules 1 + 2) ────────────────────────────────
// A worker emitted with `import {...} from "./index-<hash>.js"` throws the
// instant it is constructed and the library fails silently. Nothing in this app
// loads a worker through the bundler today; this check exists so that stays
// true if someone later adds `import wUrl from 'lib/worker.mjs?url'`.
{
  const workerLike = distFiles.filter((f) => /worker.*\.m?js$/i.test(f));
  if (workerLike.length === 0) {
    pass('no worker bundles emitted (nothing to code-split against the main chunk)');
  } else {
    for (const w of workerLike) {
      const text = readFileSync(join(dist, w.slice(1)), 'utf8');
      const bad = (text.match(/from"\.\/index-/g) || []).length;
      if (bad > 0) fail(`${w} imports the main chunk (${bad} hit(s)) — it will throw as a Worker`);
      else pass(`${w} has no import of the main chunk`);
    }
  }
}

// ─── 2. Service worker exists and precaches something ────────────────────────
const swPath = join(dist, 'sw.js');
if (!existsSync(swPath)) {
  fail('dist/sw.js missing — the app cannot work offline');
} else {
  const sw = readFileSync(swPath, 'utf8');

  // Rule 8: print and read the manifest, do not trust that it is right.
  const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  // Rule 9: entries can repeat (a file listed in both includeAssets and
  // globPatterns appears twice), so a raw count means nothing. Dedupe.
  const unique = [...new Set(urls)];
  console.log(`\n  precache: ${urls.length} entries, ${unique.length} unique`);

  if (unique.length === 0) fail('precache manifest is empty');
  else pass(`precache manifest has ${unique.length} unique entries`);

  // ─── 3. Every extension that ships is actually covered (rule 7) ────────────
  // Compare the real dist file list against the manifest instead of asserting
  // on a count. Media is excluded on purpose (runtime-cached, rule 10).
  const ignore = (f) =>
    f.startsWith('/media/') ||
    f === '/sw.js' ||
    f === '/registerSW.js' ||
    // The worker's own runtime — sw.js pulls it in via importScripts, so it is
    // never fetched by the page and does not belong in the precache manifest.
    /^\/workbox-[^/]+\.js$/.test(f) ||
    // Host rewrite rules. Read by the server, never requested by the app.
    ['/.htaccess', '/web.config', '/_redirects', '/vercel.json'].includes(f) ||
    f.endsWith('.map') ||
    /(^|\/)(Thumbs\.db|\.DS_Store)$/i.test(f);

  const expected = distFiles.filter((f) => !ignore(f));
  const cached = new Set(unique.map((u) => (u.startsWith('/') ? u : '/' + u)));
  const missing = expected.filter((f) => !cached.has(f));

  if (missing.length === 0) {
    pass(`all ${expected.length} non-media dist files are precached`);
  } else {
    const byExt = {};
    for (const m of missing) {
      const ext = (m.match(/\.[^./]+$/) || ['(none)'])[0];
      (byExt[ext] ||= []).push(m);
    }
    fail(`${missing.length} shipped file(s) are NOT precached — these break offline:`);
    for (const [ext, list] of Object.entries(byExt)) {
      console.error(`          ${ext} × ${list.length}  e.g. ${list[0]}`);
    }
  }

  // ─── 4. Media must NOT be precached (rules 10 + 11) ───────────────────────
  const precachedMedia = unique.filter((u) => u.includes('/media/'));
  if (precachedMedia.length) {
    fail(
      `${precachedMedia.length} media file(s) are in the precache — install is all-or-nothing and this ships ~500 MB to every device`,
    );
  } else {
    pass('no media precached (pulled at runtime after login instead)');
  }

  // ─── 5. Range requests must be handled (rule 17) ──────────────────────────
  if (/rangeRequests|RangeRequestsPlugin|createPartialResponse/.test(sw)) {
    pass('service worker handles Range requests (video seeking works offline)');
  } else {
    fail('no Range-request handling in sw.js — seeking a cached video will break');
  }
}

// ─── 5b. No Git LFS pointers shipped instead of real media ───────────────────
// public/media/videos/*.mp4 is tracked in Git LFS. A checkout without the LFS
// objects (Vercel's Git integration does not fetch them) leaves a ~134 byte
// text pointer in place of the video. It serves as HTTP 200 video/mp4, the
// offline downloader caches it as a success, and the bar still reaches 100 % —
// the page simply plays nothing. Production shipped exactly this.
{
  const POINTER = 'version https://git-lfs.github.com';
  const pointers = [];
  for (const f of distFiles) {
    const full = join(dist, f.slice(1));
    if (statSync(full).size > 1024) continue; // a pointer is ~130 bytes
    let head;
    try {
      head = readFileSync(full, 'utf8').slice(0, POINTER.length);
    } catch {
      continue; // unreadable as text — not a pointer
    }
    if (head === POINTER) pointers.push(f);
  }
  if (pointers.length) {
    fail(
      `${pointers.length} file(s) are Git LFS pointers, not real content — run \`git lfs pull\` before building:`,
    );
    for (const p of pointers) console.error(`          ${p}`);
  } else {
    pass('no Git LFS pointer files in dist (all media is real content)');
  }
}

// ─── 6. Nothing oversized was silently dropped ───────────────────────────────
{
  const LIMIT = 25 * 1024 * 1024; // must match maximumFileSizeToCacheInBytes
  const oversized = distFiles
    .filter((f) => !f.startsWith('/media/'))
    .map((f) => ({ f, size: statSync(join(dist, f.slice(1))).size }))
    .filter((e) => e.size > LIMIT);
  if (oversized.length) {
    fail('file(s) above maximumFileSizeToCacheInBytes will be dropped from the precache:');
    for (const o of oversized) console.error(`          ${o.f} (${(o.size / 1048576).toFixed(1)} MB)`);
  } else {
    pass('no non-media file exceeds the precache size limit');
  }
}

// ─── 7. Manifest + icons present (rules 20/21 depend on these) ───────────────
for (const required of ['/manifest.webmanifest', '/icons/pwa-192.png', '/icons/pwa-512.png', '/icons/apple-touch-icon.png']) {
  if (distFiles.includes(required)) pass(`${required} shipped`);
  else fail(`${required} missing`);
}

// ─── 8. index.html must not use relative asset URLs (rule 5) ─────────────────
{
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const rel = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
  if (rel.length) fail(`index.html has relative asset URL(s): ${rel.join(', ')}`);
  else pass('index.html uses root-relative asset URLs');
}

console.log('');
if (failures) {
  console.error(`verify-build: ${failures} check(s) failed\n`);
  process.exit(1);
}
console.log('verify-build: all checks passed\n');
