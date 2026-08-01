/**
 * Replace Git LFS pointer files with their real contents, over plain HTTPS.
 *
 * Why not `git lfs pull`: Vercel's Git integration does not give the build a
 * `.git` directory at all — the build log says "Not in a Git repository" — so
 * the git-lfs client has nothing to work with, and no GITHUB_TOKEN can change
 * that. Without this, web/public/media/videos/*.mp4 deploy as ~134 byte
 * pointers that serve HTTP 200 with Content-Type: video/mp4, and three pages
 * silently play nothing.
 *
 * The LFS batch API needs none of git's machinery: a pointer file carries the
 * object's oid and size, and that is the whole request. The repo is public, so
 * the call is unauthenticated; set GITHUB_TOKEN if it ever goes private.
 *
 * Every download is size-checked against the pointer before it is written, so
 * a truncated or error response fails the build instead of quietly becoming
 * the new video.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] ?? join(root, 'web', 'public', 'media', 'videos');

const POINTER = 'version https://git-lfs.github.com';

const owner = process.env.VERCEL_GIT_REPO_OWNER || 'Fute-Services';
const slug = process.env.VERCEL_GIT_REPO_SLUG || 'krpune';
const endpoint = `https://github.com/${owner}/${slug}.git/info/lfs/objects/batch`;

/** Parse a pointer file, or return null when the file is already real content. */
function readPointer(path) {
  // A pointer is ~130 bytes; never slurp a 100 MB video to find out.
  if (statSync(path).size > 1024) return null;
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return null; // not decodable as text, so not a pointer
  }
  if (!text.startsWith(POINTER)) return null;

  const oid = /^oid sha256:([a-f0-9]{64})$/m.exec(text)?.[1];
  const size = Number(/^size (\d+)$/m.exec(text)?.[1]);
  if (!oid || !Number.isFinite(size)) {
    throw new Error(`${path} looks like an LFS pointer but has no usable oid/size`);
  }
  return { oid, size };
}

const pending = [];
for (const name of readdirSync(dir)) {
  const path = join(dir, name);
  if (!statSync(path).isFile()) continue;
  const pointer = readPointer(path);
  if (pointer) pending.push({ path, name, ...pointer });
}

if (pending.length === 0) {
  console.log('[lfs] no pointer files — the checkout already has the real media');
  process.exit(0);
}

console.log(`[lfs] resolving ${pending.length} pointer(s) via ${endpoint}`);

const headers = {
  Accept: 'application/vnd.git-lfs+json',
  'Content-Type': 'application/vnd.git-lfs+json',
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  console.log('[lfs] using GITHUB_TOKEN');
}

const batch = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    operation: 'download',
    transfers: ['basic'],
    objects: pending.map(({ oid, size }) => ({ oid, size })),
  }),
});

if (!batch.ok) {
  throw new Error(`LFS batch API returned ${batch.status} ${batch.statusText}: ${await batch.text()}`);
}

const { objects = [] } = await batch.json();
const byOid = new Map(objects.map((o) => [o.oid, o]));

for (const file of pending) {
  const entry = byOid.get(file.oid);
  const href = entry?.actions?.download?.href;
  if (!href) {
    throw new Error(
      `LFS gave no download URL for ${file.name}: ${JSON.stringify(entry?.error ?? entry)}`,
    );
  }

  const res = await fetch(href, { headers: entry.actions.download.header ?? {} });
  if (!res.ok) throw new Error(`${file.name}: download returned ${res.status} ${res.statusText}`);

  const bytes = Buffer.from(await res.arrayBuffer());
  // The pointer states the exact size, so this is an equality check, not a
  // heuristic — a truncated download must never become the shipped video.
  if (bytes.length !== file.size) {
    throw new Error(`${file.name}: expected ${file.size} bytes, got ${bytes.length}`);
  }

  writeFileSync(file.path, bytes);
  console.log(`[lfs] ${file.name} ← ${bytes.length} bytes`);
}

console.log(`[lfs] ${pending.length} file(s) restored`);
