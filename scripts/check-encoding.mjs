// Scans every tracked text file for the encoding damage that silently broke
// .github/workflows/build-windows.yml: a UTF-8 BOM, C1 control characters
// (U+0080-U+009F) or CP-1252 mojibake left behind by an editor that read a
// UTF-8 file as CP-1252 and wrote it back.
//
// The workflow failure this comes from was invisible for 44 runs - GitHub
// reported a 0-second run with no jobs and no error message anyone would read
// as "your file has a stray U+008F in it". Cheap to re-run when something
// parses locally but not on a server.
//
// This file is deliberately pure ASCII: every character it hunts for is built
// from its code point rather than typed. The first version spelled the patterns
// out literally and so reported *itself* as damaged the moment it was
// committed. Excluding the checker from its own scan would have been the wrong
// fix - a scanner with a blind spot is how this class of bug hides in the first
// place.
//
// Usage: node scripts/check-encoding.mjs   (exit 1 if anything is damaged)

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX_BYTES = 3_000_000; // skip binaries/large media; they are not text

const ch = (code) => String.fromCharCode(code);
const range = (from, to) => `${ch(from)}-${ch(to)}`;

/** U+0080-U+009F. Invalid in a YAML stream, and invisible in every editor. */
const C1 = new RegExp(`[${range(0x80, 0x9f)}]`);

/**
 * Structural mojibake, rather than a list of examples that the next case would
 * slip past.
 *
 * A UTF-8 sequence misdecoded as CP-1252 always comes back as a lead character
 * from a small set - U+00C2/U+00C3 for the 2-byte sequences, U+00E2/U+00E3 and
 * U+00F0 for the 3- and 4-byte ones, so em dashes and emoji - followed by
 * whatever CP-1252 maps the continuation bytes to: U+00A0-U+00BF, or one of the
 * punctuation characters it puts in the 0x80-0x9F slots. C1 above covers the
 * five slots CP-1252 leaves undefined (0x81, 0x8d, 0x8f, 0x90, 0x9d) - 0x8f is
 * the one that came out of the variation selector in the workflow's emoji and
 * made the file unparseable.
 */
const MOJIBAKE_LEADS = [0xc2, 0xc3, 0xe2, 0xe3, 0xf0].map(ch).join('');
const CP1252_PUNCTUATION = [
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]
  .map(ch)
  .join('');
const MOJIBAKE = new RegExp(`[${MOJIBAKE_LEADS}][${range(0xa0, 0xbf)}${CP1252_PUNCTUATION}]`);

/** U+FFFD - a decode that already gave up. Nothing legitimate ships one. */
const REPLACEMENT = new RegExp(ch(0xfffd));

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
  if (REPLACEMENT.test(text)) problems.push('U+FFFD replacement character');
  if (problems.length) damaged.push(`  ${file} - ${problems.join(', ')}`);
}

if (damaged.length) {
  console.error(`Encoding damage in ${damaged.length} file(s):\n${damaged.join('\n')}`);
  process.exit(1);
}
console.log(`clean - ${files.length} tracked files, no BOM, C1 controls or mojibake`);
