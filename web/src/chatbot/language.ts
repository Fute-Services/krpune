/**
 * Which language the visitor is speaking, decided in code.
 *
 * Shared by the model's instructions (chatClient) and the prepared answers
 * (faq), and deliberately free of imports so the tests can load it without
 * pulling in the app.
 */
export type Language = 'devanagari' | 'hinglish' | 'english';

const HINGLISH =
  /\b(hai|hain|kya|kitna|kitne|kitni|kaisa|kaise|kaisi|kahan|kab|mein|mujhe|aap|aapka|yeh|ye|woh|wahan|yahan|ka|ki|ke|ko|se|aur|nahi|nahin|haan|ha|accha|acha|theek|thik|dikhao|batao|bataiye|chahiye|karo|kariye|karao|wala|wali|kuch|bhi|toh|abhi|sab|poora|pura)\b/gi;

export function languageOf(text: string): Language | null {
  if (/[ऀ-ॿ]/.test(text)) return 'devanagari';
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length === 0) return null;
  const hindi = (text.match(HINGLISH) ?? []).length;
  if (hindi >= 2 || (hindi === 1 && words.length <= 3)) return 'hinglish';
  // "ok", "yes", "sure" say nothing about the language the visitor thinks in.
  if (words.length <= 2) return null;
  return 'english';
}

/**
 * The language to answer in.
 *
 * The rule in the model's instructions was not enough on its own: with a brief
 * written in English, a Devanagari question about parking came back in English,
 * and Hinglish answers drifted into "Want to see the floor plan?" halfway
 * through. Short replies ("ok", "haan") carry no signal, so they inherit the
 * language of the visitor's last real question.
 */
export function replyLanguage(
  question: string,
  history: readonly { role: string; content: string }[],
): Language {
  const asked = languageOf(question);
  if (asked) return asked;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role !== 'user') continue;
    const earlier = languageOf(history[i].content);
    if (earlier) return earlier;
  }
  return 'english';
}
