import { COUNTRIES, type Country } from "./countries";

// Matching typed country names: English or French, any accents or capitals, common nicknames,
// and (for single questions) small typos.

/** "Côte d'Ivoire" → "cotedivoire", "St. Lucia" → "saintlucia", "the Netherlands" → "netherlands". */
export function normalizeName(s: string) {
  return ` ${s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’'`.()\-_/]/g, " ")} `
    .replace(/\s(st|ste)\s/g, (_, w) => (w === "st" ? " saint " : " sainte "))
    .trim()
    .replace(/^(the|le|la|les|l)\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

type Entry = { key: string; country: Country };

let entries: Entry[] | null = null;
let index: Map<string, Country[]> | null = null;

function build() {
  if (index && entries) return { index, entries };
  entries = [];
  index = new Map();
  for (const c of COUNTRIES) {
    for (const key of new Set(c.aliases.map(normalizeName))) {
      if (!key) continue;
      entries.push({ key, country: c });
      const list = index.get(key) ?? [];
      list.push(c);
      index.set(key, list);
    }
  }
  return { index, entries };
}

export function aliasKeys(c: Country) {
  return [...new Set(c.aliases.map(normalizeName))].filter(Boolean);
}

/** Countries whose name exactly matches the input (after normalizing). Usually one. */
export function findExact(input: string): Country[] {
  return build().index.get(normalizeName(input)) ?? [];
}

function levenshtein(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Checks a typed answer against the country that was asked. Returns the country the player
 * named (null if it isn't a country at all) and whether it's the right one.
 * Small typos count, unless the typo is closer to (or exactly) another country's name.
 */
export function matchTyped(input: string, target: Country): { correct: boolean; picked: Country | null } {
  const key = normalizeName(input);
  if (!key) return { correct: false, picked: null };
  const exact = findExact(input);
  if (exact.some((c) => c.code === target.code)) return { correct: true, picked: target };
  if (exact.length) return { correct: false, picked: exact[0] };

  const tolerance = key.length >= 9 ? 2 : key.length >= 5 ? 1 : 0;
  if (!tolerance) return { correct: false, picked: null };
  let best = tolerance + 1;
  let bestCountries = new Set<Country>();
  for (const e of build().entries) {
    const d = levenshtein(key, e.key, tolerance);
    if (d < best) {
      best = d;
      bestCountries = new Set([e.country]);
    } else if (d === best && d <= tolerance) bestCountries.add(e.country);
  }
  if (best > tolerance) return { correct: false, picked: null };
  if (bestCountries.size === 1 && bestCountries.has(target)) return { correct: true, picked: target };
  const other = [...bestCountries].find((c) => c.code !== target.code) ?? null;
  return { correct: false, picked: other };
}
