/**
 * Cutting a reply that is still arriving into pieces the voice can start on.
 *
 * The guide used to wait for the whole answer, then send it off to be voiced,
 * then speak — two to four seconds of silence after the text was already on
 * screen. Handing each finished sentence to the voice as soon as it exists
 * lets the first one play while the model is still writing the rest.
 *
 * No imports, so the tests can load it on its own.
 */

/**
 * Shorter pieces are held and joined to the next sentence. A voice rendered
 * one clause at a time loses its intonation and pauses in odd places; "Yes."
 * on its own is better said as part of what follows.
 */
export const MIN_CHUNK = 28;

/**
 * Where a sentence ends: . ! ? or the Devanagari danda, then whitespace, then
 * the capital (or Devanagari letter) that starts the next one. Requiring that
 * next letter is what keeps "2.7 million", "sq. ft." and "approx. 17" whole —
 * and it means a sentence is only cut once the next one has begun arriving,
 * which in a live stream is a matter of milliseconds.
 */
const SENTENCE_END = /[.!?।]+["')\]]*(?=\s+["'(]?[A-Zऀ-ॿ])/g;

/**
 * Returns the complete pieces in `text` after position `from`, and where the
 * next call should start. With `final` everything left over is returned too.
 */
export function nextSpeakable(
  text: string,
  from: number,
  final: boolean,
): { chunks: string[]; to: number } {
  const chunks: string[] = [];
  let cut = from;
  const re = new RegExp(SENTENCE_END.source, 'g');
  re.lastIndex = from;

  for (let match = re.exec(text); match; match = re.exec(text)) {
    const end = match.index + match[0].length;
    const piece = text.slice(cut, end).trim();
    // Too short to stand alone: leave `cut` where it is, so the next sentence
    // is added to this one.
    if (piece.length >= MIN_CHUNK) {
      chunks.push(piece);
      cut = end;
    }
  }

  if (final) {
    const rest = text.slice(cut).trim();
    if (rest) chunks.push(rest);
    cut = text.length;
  }

  return { chunks, to: cut };
}
