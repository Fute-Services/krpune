// Scans every tracked text file for the encoding damage that silently broke
// .github/workflows/build-windows.yml: a UTF-8 BOM, C1 control characters
// (U+0080-U+009F) or CP-1252 mojibake left behind by an editor that read a
// UTF-8 file as CP-1252 and wrote it back.
//
// The workflow failure this comes from was invisible for 44 runs — GitHub
// reported a 0-second run with no jobs and no error message anyone would read
// as "your file has a stray U+008F in it". Cheap to re-run when something
// parses locally but not on a server.
//
// Usage: node scripts/check-encoding.mjs   (exit 1 if anything is damaged)

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX_BYTES = 3_000_000; // skip binaries/large media; they are not text
const C1 = /[-]/;
const MOJIBAKE = /â€"|â€“|â€™|Ã©|Ã¨|Ã¢|ï¿½|ðŸ|â¬|âœ|Â«|Â»/;

const files = execSync('git ls-files', { maxBuffer: 1e8 }).toString().split('\n').filter(Boolean);
const damaged = [];

for (const file of files) {
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    continue; // LFS pointer swapped out, symlink, etc.
  }
  if (bytes.length > MAX_BYTES) continue;
  if (bytes.includes(0)) continue; // binary

  const text = bytes.toString('utf8');
  const problems = [];
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) problems.push('UTF-8 BOM');
  if (C1.test(text)) problems.push('C1 control character');
  if (MOJIBAKE.test(text)) problems.push('CP-1252 mojibake');
  if (problems.length) damaged.push(`  ${file} — ${problems.join(', ')}`);
}

if (damaged.length) {
  console.error(`Encoding damage in ${damaged.length} file(s):\n${damaged.join('\n')}`);
  process.exit(1);
}
console.log(`clean — ${files.length} tracked files, no BOM, C1 controls or mojibake`);
