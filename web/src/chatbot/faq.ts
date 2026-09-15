/**
 * Prepared answers for the questions every visitor asks.
 *
 * "Airport kitna door hai?" gets asked all day, and sending it to the model
 * each time buys the same two sentences again: a second or two of silence,
 * ~2,000 tokens against an 8,000-a-minute account, and a fresh voice render.
 * Answered from here it is instant, costs nothing, and plays a clip rendered
 * once by scripts/generate-tour-audio.mjs.
 *
 * The matching is strict on purpose. A slow answer is a nuisance; a prepared
 * answer to a question nobody asked — the 10th floor's carpet area answered
 * with the campus size — is a wrong answer on a sales floor. Anything that is
 * not plainly one of these questions goes to the model, which still has every
 * fact below in its brief.
 *
 * Every answer restates knowledge.ts. If a fact changes there, change it here
 * and re-render the clips (`npm run faq:audio -- --force`).
 */
import type { ChatMessage } from './chatClient';
// The attribute is for Node, which loads this file directly in the tests; Vite
// does not need it but accepts it.
import answers from './faqAnswers.json' with { type: 'json' };
import { replyLanguage, type Language } from './language';

type AnswerId = keyof typeof answers;

interface Rule {
  id: AnswerId;
  /** Every pattern must match. */
  all: RegExp[];
  /** Any of these means it is a different question. */
  none?: RegExp[];
}

// `\b` does not work around Devanagari, so those words sit outside it.
const DISTANCE =
  /\b(far|distance|door|dur|km|kms|kilomet\w*|kitna|kitni|kitne|how long|minutes?|time)\b|दूर|दूरी|कितन|मिनट|किलोमीटर/i;

const RULES: Rule[] = [
  {
    id: 'airport',
    all: [/\bairport\b|एयरपोर्ट|हवाई ?अड्ड/i, DISTANCE],
  },
  {
    id: 'station',
    all: [/\b(railway|train|station)\b|रेलवे|ट्रेन|स्टेशन/i, DISTANCE],
    // Metro and bus are not in the brief; the railway answer would be wrong.
    none: [/\b(metro|bus)\b|मेट्रो|बस/i],
  },
  {
    id: 'size',
    all: [/\b(acres?|how big|kitna bada|kitni badi|size|total area|leasable|million)\b|एकड़|कितना बड़ा|कितनी बड़ी|साइज|कुल एरिया|क्षेत्रफल/i],
    // "10th floor ka area" is the floor table, not the campus.
    none: [/\b(floors?|carpet|towers?|units?|office|parking|food|lobby|\d+(st|nd|rd|th))\b|फ्लोर|मंज़?िल|कार्पेट|टावर|पार्किंग/i],
  },
  {
    id: 'parking',
    all: [/\bparking\b|पार्किंग/i],
    // Booking, charges, capacity and EV charging are not in the brief.
    none: [/\b(book\w*|screen|slots?|charges?|fees?|price|cost|rates?|cars?|gaadi|gadi|vehicles?|capacity|spaces?|ev|charging|visitors?)\b|बुक|गाड़ी|चार्ज|कीमत/i],
  },
  {
    id: 'leed',
    all: [/\b(leed|green building|certified|certification|eco.?friendly)\b|सर्टिफ|ग्रीन बिल्डिंग/i],
    // The specific measures are a longer answer the model gives better.
    none: [/\b(water|energy|solar|electricity|rain\w*|paani|bijli|features?)\b|पानी|बिजली|सोलर/i],
  },
  {
    id: 'towers',
    all: [
      /\btowers?\b|टावर/i,
      /\b(how many|kitne|kitni|number|floors|storeys|stories|manzil|levels)\b|कितने|कितनी|मंज़?िल|फ्लोर/i,
    ],
    none: [/\b(carpet|area|sq|square|lifts?|elevators?|refuge|\d+(st|nd|rd|th)|t1|t2|tower ?[12])\b|कार्पेट|लिफ्ट|एरिया/i],
  },
  {
    id: 'foodcourt',
    all: [/\bfood ?court\b|फूड ?कोर्ट/i],
    none: [/\b(terrace|rooftop|menu|timings?|price)\b|टैरेस|छत/i],
  },
  {
    id: 'developer',
    all: [/\b(developer|developed|builder|who (built|is building|made|owns)|kisne banaya|kisne bana|kiska project|kaun si company)\b|डेवलपर|बिल्डर|किसने बनाया|किसका प्रोजेक्ट/i],
  },
  {
    id: 'where',
    all: [/\b(where is (it|this|the project|commerzone)|kahan hai|kaha hai|kahaan hai|location kya hai)\b|कहाँ है|कहां है/i],
    // "Where is the food court / the airport" is about something else.
    none: [/\b(food|parking|lobby|reception|gym|pool|lifts?|toilets?|washrooms?|cafeteria|entry|gate|office|towers?|airport|station|hospital|school|mall|hotel)\b|फूड|पार्किंग|लॉबी|लिफ्ट|टॉयलेट|गेट|एयरपोर्ट|स्टेशन|अस्पताल|स्कूल|मॉल/i],
  },
];

/** Longer than this and it is rarely just the prepared question. */
const MAX_WORDS = 10;

/** Two questions in one ("…aur rent kitna hai?") need the model. */
const JOINED = /\b(and|aur|also|plus|tatha)\b|और|तथा|\?.+\?/i;

export interface PreparedAnswer {
  id: AnswerId;
  language: Language;
  answer: string;
}

export function matchFaq(question: string, history: readonly ChatMessage[]): PreparedAnswer | null {
  const text = question.trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > MAX_WORDS) return null;
  if (words.length > 4 && JOINED.test(text)) return null;

  const hits = RULES.filter(
    (rule) => rule.all.every((re) => re.test(text)) && !(rule.none ?? []).some((re) => re.test(text)),
  );
  // Exactly one, or it is ambiguous enough to deserve the model.
  if (hits.length !== 1) return null;

  const language = replyLanguage(text, history);
  return { id: hits[0].id, language, answer: answers[hits[0].id][language] };
}
