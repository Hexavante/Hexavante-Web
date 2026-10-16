/**
 * Motor rigoroso de linguagem ofensiva (PT + EN) para comunidade, DMs e perfis.
 * Camadas: unicode/invisíveis → leetspeak → frases → termos → regex compacto → stems → texto invertido.
 */

import {
  BLOCKED_COMPACT_PATTERNS,
  BLOCKED_PHRASES,
  BLOCKED_STEMS,
  BLOCKED_TERMS,
  BOUNDARY_ONLY_TERMS,
} from "@/lib/profanity-lists";

export class ContentPolicyError extends Error {
  constructor(message = "Sua mensagem contém linguagem não permitida na plataforma.") {
    super(message);
    this.name = "ContentPolicyError";
  }
}

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "i",
  "€": "e",
  "£": "l",
};

const INVISIBLE_CHARS =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u3164\uFFA0]/g;

const HOMOGLYPH_MAP = new Map<number, string>([
  [0x0430, "a"],
  [0x0435, "e"],
  [0x043e, "o"],
  [0x0440, "p"],
  [0x0441, "c"],
  [0x0443, "y"],
  [0x0445, "x"],
  [0x0456, "i"],
  [0x04cf, "l"],
  [0x0501, "d"],
  [0x051b, "h"],
  [0x03b1, "a"],
  [0x03b5, "e"],
  [0x03bf, "o"],
  [0x03c1, "p"],
  [0x03c3, "s"],
  [0x03c5, "u"],
  [0x03c7, "x"],
  [0xff41, "a"],
  [0xff45, "e"],
  [0xff4f, "o"],
  [0xff50, "p"],
  [0xff53, "s"],
  [0xff55, "u"],
  [0xff58, "x"],
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripInvisibleChars(value: string) {
  return value.replace(INVISIBLE_CHARS, "");
}

function normalizeHomoglyphs(value: string) {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code >= 0xff01 && code <= 0xff5e) {
      result += String.fromCharCode(code - 0xfee0);
      continue;
    }
    const mapped = HOMOGLYPH_MAP.get(code);
    result += mapped ?? char;
  }
  return result;
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function applyLeet(value: string) {
  let result = value;
  for (const [from, to] of Object.entries(LEET_MAP)) {
    result = result.split(from).join(to);
  }
  return result;
}

function collapseRepeats(value: string) {
  return value.replace(/(.)\1{2,}/g, "$1$1");
}

function collapseSeparators(value: string) {
  return value.replace(/(?<=[a-z0-9])[\W_]+(?=[a-z0-9])/gi, "");
}

function prepareRawText(text: string) {
  return stripInvisibleChars(normalizeHomoglyphs(text));
}

function normalizeSpaced(text: string) {
  return collapseRepeats(
    stripAccents(applyLeet(prepareRawText(text)))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeCompact(text: string) {
  const spaced = normalizeSpaced(text);
  const collapsed = collapseSeparators(spaced);
  return collapsed.replace(/\s+/g, "");
}

function wordBoundaryPattern(term: string) {
  const normalized = normalizeSpaced(term).replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![a-z0-9])${normalized}(?![a-z0-9])`, "i");
}

function fuzzyCharPattern(term: string) {
  const chars = normalizeCompact(term).split("");
  if (chars.length === 0) return null;
  const joined = chars.map((char) => `${escapeRegExp(char)}[\\s\\W_*\\-.|]*`).join("");
  return new RegExp(joined, "i");
}

function matchesCompactPatterns(text: string): string | null {
  const compact = normalizeCompact(text);
  if (!compact) return null;

  for (const pattern of BLOCKED_COMPACT_PATTERNS) {
    const match = compact.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function matchesStem(text: string): string | null {
  const compact = normalizeCompact(text);
  if (!compact) return null;

  for (const stem of BLOCKED_STEMS) {
    if (stem.length >= 5 && compact.includes(stem)) return stem;
  }

  return null;
}

function matchesTerm(text: string, term: string): boolean {
  const spaced = normalizeSpaced(text);
  const compact = normalizeCompact(text);
  const normalizedTerm = normalizeSpaced(term);
  const compactTerm = normalizeCompact(term);

  if (!normalizedTerm) return false;

  if (BOUNDARY_ONLY_TERMS.has(normalizedTerm)) {
    return wordBoundaryPattern(term).test(spaced);
  }

  if (wordBoundaryPattern(normalizedTerm).test(spaced)) return true;

  if (compactTerm.length >= 3 && compact.includes(compactTerm)) return true;

  if (compactTerm.length >= 3) {
    const fuzzy = fuzzyCharPattern(term);
    if (fuzzy && fuzzy.test(prepareRawText(text))) return true;
  }

  return false;
}

function matchesPhrase(text: string, phrase: string): boolean {
  const spaced = normalizeSpaced(text);
  const normalizedPhrase = normalizeSpaced(phrase);
  if (!normalizedPhrase) return false;
  if (spaced.includes(normalizedPhrase)) return true;

  const compact = normalizeCompact(text);
  const compactPhrase = normalizeCompact(phrase);
  if (compactPhrase.length >= 6 && compact.includes(compactPhrase)) return true;

  return false;
}

function matchesSpacedLetterEvasion(text: string): string | null {
  const prepared = prepareRawText(text);
  const chunks = prepared
    .split(/[\s/\\|]+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((part) => part.length === 1);

  if (chunks.length < 4) return null;

  const joined = chunks.join("");
  if (joined.length >= 4) {
    const hit = scanTextCore(joined, false);
    if (hit) return hit;
  }

  return null;
}

function scanTextCore(text: string, includeReversed: boolean): string | null {
  if (!text.trim()) return null;

  for (const phrase of BLOCKED_PHRASES) {
    if (matchesPhrase(text, phrase)) return phrase;
  }

  for (const term of BLOCKED_TERMS) {
    if (matchesTerm(text, term)) return term;
  }

  const patternHit = matchesCompactPatterns(text);
  if (patternHit) return patternHit;

  const stemHit = matchesStem(text);
  if (stemHit) return stemHit;

  const spacedHit = matchesSpacedLetterEvasion(text);
  if (spacedHit) return spacedHit;

  if (includeReversed) {
    const reversed = prepareRawText(text).split("").reverse().join("");
    if (reversed.length >= 4) {
      const reversedHit = scanTextCore(reversed, false);
      if (reversedHit) return reversedHit;
    }
  }

  return null;
}

function scanText(text: string): string | null {
  return scanTextCore(text, true);
}

export function findBlockedContent(text: string): string | null {
  return scanText(text);
}

export function findSequenceEvasion(recentFragments: string[], newText: string): string | null {
  const current = newText.trim();
  if (!current) return null;

  if (scanText(current)) return null;

  const fragments = recentFragments
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !scanText(part));

  if (fragments.length === 0) return null;

  const maxTail = Math.min(fragments.length, 8);
  for (let take = 1; take <= maxTail; take++) {
    const tail = fragments.slice(-take);
    const combined = [...tail, current];

    const hitSpace = scanText(combined.join(" "));
    if (hitSpace) return hitSpace;

    const hitCompact = scanText(combined.join(""));
    if (hitCompact) return hitCompact;

    const hitDotted = scanText(combined.join("."));
    if (hitDotted) return hitDotted;
  }

  return null;
}

export function findBlockedContentInParts(parts: string[]): string | null {
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1]?.trim() ?? "";
  const prior = parts.slice(0, -1);
  return findSequenceEvasion(prior, last) ?? findBlockedContent(last);
}

export function containsProfanity(text: string): boolean {
  return findBlockedContent(text) !== null;
}

export function getContentPolicyHint(text: string): string | null {
  if (!text.trim()) return null;
  if (containsProfanity(text)) {
    return "Detectamos linguagem não permitida. Revise o texto antes de publicar.";
  }
  return null;
}

export function assertCleanContent(text: string, fieldLabel = "mensagem"): void {
  const blocked = findBlockedContent(text);
  if (blocked) {
    throw new ContentPolicyError(
      `Sua ${fieldLabel} contém linguagem não permitida. Revise o texto e tente novamente.`,
    );
  }
}

function maskMatch(match: string): string {
  return "*".repeat(Math.max(3, match.length));
}

export function filterProfanity(text: string): string {
  let result = prepareRawText(text);

  for (const phrase of BLOCKED_PHRASES) {
    if (!matchesPhrase(result, phrase)) continue;
    const pattern = new RegExp(escapeRegExp(phrase), "gi");
    result = result.replace(pattern, (match) => maskMatch(match));
  }

  for (const term of BLOCKED_TERMS) {
    if (!matchesTerm(result, term)) continue;
    const pattern = wordBoundaryPattern(term);
    result = result.replace(pattern, (match) => maskMatch(match));
  }

  if (findBlockedContent(result)) {
    result = result
      .split(/\s+/)
      .map((word) => (findBlockedContent(word) ? maskMatch(word) : word))
      .join(" ");
  }

  if (findBlockedContent(result)) {
    const compactHit = matchesCompactPatterns(result) ?? matchesStem(result);
    if (compactHit) {
      const fuzzy = new RegExp(escapeRegExp(compactHit), "gi");
      result = result.replace(fuzzy, (match) => maskMatch(match));
    }
  }

  return result;
}

export function findBlockedUsername(username: string): string | null {
  if (!username.trim()) return null;

  for (const phrase of BLOCKED_PHRASES) {
    if (matchesPhrase(username, phrase)) return phrase;
  }

  const compact = normalizeCompact(username);

  for (const term of BLOCKED_TERMS) {
    const compactTerm = normalizeCompact(term);
    if (!compactTerm) continue;
    if (compact === compactTerm) return term;
    if (compactTerm.length >= 4 && compact.includes(compactTerm)) return term;
    if (wordBoundaryPattern(term).test(normalizeSpaced(username))) return term;
  }

  const patternHit = matchesCompactPatterns(username);
  if (patternHit) return patternHit;

  const stemHit = matchesStem(username);
  if (stemHit) return stemHit;

  return null;
}

export function assertCleanUsername(username: string): void {
  const blocked = findBlockedUsername(username);
  if (blocked) {
    throw new ContentPolicyError("Este nome de usuário não é permitido.");
  }
}
