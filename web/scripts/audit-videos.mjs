/**
 * ffprobe every shipped video and flag the ones that will misbehave on iPad.
 *
 * Rule 14: a single 4K / high-level file among otherwise-1080p videos shows as
 * a black player stuck at 0:00 — the file "exists", the path is right, and
 * nothing in the console complains.
 * Rule 15: if the moov atom sits after mdat the browser must download the whole
 * file before the first frame, which looks identical to a broken video on a
 * slow connection.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const MAX_LEVEL = 40; // ffprobe reports level×10, so 4.0 → 40
const MAX_BITRATE = 6_000_000;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(mp4|m4v|mov|webm)$/i.test(e.name)) out.push(full);
  }
  return out;
}

function probe(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
     'stream=width,height,codec_name,profile,level,r_frame_rate', '-show_entries',
     'format=bit_rate', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  const json = JSON.parse(out);
  const s = json.streams?.[0] ?? {};
  return {
    width: s.width, height: s.height, codec: s.codec_name, profile: s.profile,
    level: s.level, fps: s.r_frame_rate, bitrate: Number(json.format?.bit_rate) || 0,
  };
}

/**
 * Is moov before mdat? Anything else means the browser must download the whole
 * file before the first frame.
 *
 * Parsed straight from the container rather than scraped from `ffprobe -v trace`:
 * trace goes to stderr, so reading it from stdout silently returned an empty
 * string and reported *every* file as broken — including one that had just been
 * remuxed with +faststart. A checker that always says "broken" is worse than no
 * checker, so this walks the top-level atom table instead.
 */
function moovFirst(file) {
  const fd = openSync(file, 'r');
  try {
    let offset = 0;
    const header = Buffer.alloc(16);
    const fileSize = statSync(file).size;
    for (;;) {
      if (offset + 8 > fileSize) return false;
      const read = readSync(fd, header, 0, 16, offset);
      if (read < 8) return false;
      let size = header.readUInt32BE(0);
      const type = header.toString('latin1', 4, 8);
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      if (size === 1) size = Number(header.readBigUInt64BE(8)); // 64-bit extended size
      else if (size === 0) return false; // extends to EOF; no moov found before it
      if (size < 8) return false;
      offset += size;
    }
  } finally {
    closeSync(fd);
  }
}

const files = [...walk(join(root, 'public', 'media')), ...walk(join(root, 'src', 'assets'))];

let problems = 0;
for (const file of files) {
  const rel = relative(root, file).split(/[\\/]/).join('/');
  const sizeMb = (statSync(file).size / 1048576).toFixed(1);
  let info;
  let front;
  try {
    info = probe(file);
    front = moovFirst(file);
  } catch (error) {
    console.error(`  ERROR ${rel}: ${error.message.split('\n')[0]}`);
    problems += 1;
    continue;
  }

  // Problems break playback or first-frame time on the target device.
  const issues = [];
  if (info.codec !== 'h264') issues.push(`codec ${info.codec} (not h264)`);
  if (info.width > MAX_WIDTH || info.height > MAX_HEIGHT)
    issues.push(`${info.width}x${info.height} exceeds ${MAX_WIDTH}x${MAX_HEIGHT}`);
  if (info.bitrate > MAX_BITRATE)
    issues.push(`${(info.bitrate / 1e6).toFixed(1)} Mbps > 6 Mbps`);
  if (!front) issues.push('moov atom after mdat — whole file downloads before the first frame');

  // Advisories are off the stated target but not a known failure on iPad, which
  // decodes High up to level 5.2. Reported rather than hidden, so the call is
  // visible instead of being quietly loosened in the threshold.
  const advisories = [];
  if (info.level > MAX_LEVEL)
    advisories.push(
      `level ${(info.level / 10).toFixed(1)} is above the 4.0 target (usually just the frame rate — ${info.fps} fps here)`,
    );

  const head = `${rel}  ${sizeMb} MB  ${info.width}x${info.height} ${info.profile} L${(info.level / 10).toFixed(1)} ${(info.bitrate / 1e6).toFixed(1)}Mbps ${front ? 'faststart' : 'NOT-faststart'}`;
  if (issues.length) {
    problems += 1;
    console.log(`  FAIL  ${head}`);
    for (const i of issues) console.log(`          - ${i}`);
    for (const a of advisories) console.log(`          ~ ${a}`);
  } else if (advisories.length) {
    console.log(`  note  ${head}`);
    for (const a of advisories) console.log(`          ~ ${a}`);
  } else {
    console.log(`  ok    ${head}`);
  }
}

console.log(`\n${files.length} video(s) checked, ${problems} with playback-affecting issues.`);
console.log(
  'Fix with:\n' +
  '  ffmpeg -i in.mp4 -vf "scale=1920:-2:flags=lanczos" -c:v libx264 \\\n' +
  '    -profile:v high -level:v 4.0 -pix_fmt yuv420p -crf 23 -maxrate 6M \\\n' +
  '    -bufsize 12M -preset slow -movflags +faststart out.mp4\n' +
  'Then compare a before/after frame — do not trust the numbers alone.',
);

process.exit(problems ? 1 : 0);
