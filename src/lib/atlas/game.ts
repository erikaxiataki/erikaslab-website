import { type Country, QUIZ_COUNTRIES, type Scope, distanceKm, inScope } from "./countries";

export type QuestionKind = "map" | "flag" | "flag-reverse" | "capital" | "name";
export type Mode = QuestionKind | "mix";
export type Difficulty = "easy" | "normal" | "hard";

export const MODES: { id: Mode; label: string; emoji: string; blurb: string }[] = [
  { id: "map", label: "Map Hunt", emoji: "🗺️", blurb: "Find the country on the map" },
  { id: "flag", label: "Flag Quiz", emoji: "🏳️", blurb: "Whose flag is this?" },
  { id: "flag-reverse", label: "Flag Match", emoji: "🎌", blurb: "Pick the right flag" },
  { id: "capital", label: "Capitals", emoji: "🏛️", blurb: "Name the capital city" },
  { id: "name", label: "Name It", emoji: "✍️", blurb: "Type the highlighted country" },
  { id: "mix", label: "Mix It Up", emoji: "🎲", blurb: "A bit of everything" },
];

export const DIFFICULTY: Record<
  Difficulty,
  { label: string; emoji: string; seconds: number; lives: number; minArea: number; mult: number }
> = {
  easy: { label: "Easy", emoji: "🟢", seconds: 30, lives: 3, minArea: 100_000, mult: 1 },
  normal: { label: "Normal", emoji: "🟡", seconds: 15, lives: 3, minArea: 20_000, mult: 1.5 },
  hard: { label: "Hard", emoji: "🔴", seconds: 8, lives: 1, minArea: 0, mult: 2.5 },
};

/** Typing takes longer than tapping, so Name It questions get extra time. */
export function timeLimitMs(kind: QuestionKind, difficulty: Difficulty) {
  return (DIFFICULTY[difficulty].seconds + (kind === "name" ? 10 : 0)) * 1000;
}

export type Question = {
  kind: QuestionKind;
  country: Country;
  /** Four choices (including the answer) for multiple-choice kinds. */
  options: Country[];
};

export type Answer = {
  correct: boolean;
  points: number;
  ms: number;
  /** Map Hunt only: how far off a wrong click was. */
  distanceKm?: number;
  pickedCode?: string;
};

/** Small, fast, seedable PRNG so friends get the exact same questions. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

export function dailySeed(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function shuffle<T>(items: T[], rand: () => number) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pool(kind: QuestionKind, scope: Scope, difficulty: Difficulty) {
  const base = QUIZ_COUNTRIES.filter((c) => inScope(c, scope) && ((kind !== "map" && kind !== "name") || c.mapId));
  // Easier levels stick to bigger, better-known countries; relax if a region runs short.
  for (const minArea of [DIFFICULTY[difficulty].minArea, 20_000, 0]) {
    const p = base.filter((c) => c.area >= minArea);
    if (p.length >= 15) return p;
  }
  return base;
}

function distractors(answer: Country, kind: QuestionKind, difficulty: Difficulty, rand: () => number) {
  const others = QUIZ_COUNTRIES.filter(
    (c) => c.code !== answer.code && (kind !== "capital" || c.capital !== answer.capital),
  );
  const near =
    difficulty === "hard"
      ? others.filter((c) => c.subregion === answer.subregion)
      : difficulty === "normal"
        ? others.filter((c) => c.region === answer.region)
        : others.filter((c) => c.area >= 100_000);
  const picks = shuffle(near, rand).slice(0, 3);
  if (picks.length < 3) {
    const sameRegion = shuffle(
      others.filter((c) => c.region === answer.region && !picks.includes(c)),
      rand,
    );
    picks.push(...sameRegion.slice(0, 3 - picks.length));
  }
  if (picks.length < 3) picks.push(...shuffle(others, rand).filter((c) => !picks.includes(c)).slice(0, 3 - picks.length));
  return picks;
}

// "Mix" sticks to tap-to-answer kinds; typing has its own mode.
const KINDS: QuestionKind[] = ["map", "flag", "flag-reverse", "capital"];

/**
 * What the player has seen and knows, used to keep solo games fresh: countries asked recently go to
 * the back of the queue, and ones they don't know well yet come up more often.
 */
export type Freshness = { recent: string[]; mastery: Record<string, number> };

/**
 * Builds a list of questions from a seed. Without `fresh` it's fully deterministic (daily challenge,
 * challenge links and online rooms rely on everyone getting the same questions).
 */
export function generateQuestions(
  seed: number,
  mode: Mode,
  scope: Scope,
  difficulty: Difficulty,
  count: number,
  fresh?: Freshness,
): Question[] {
  const rand = mulberry32(seed);
  // Newest recent country gets the biggest push back; the oldest barely any.
  const recency = new Map(fresh?.recent.map((code, i, all) => [code, (i + 1) / all.length]));
  // Deck order: the end of the array is asked first.
  const order = (list: Country[]) =>
    fresh
      ? list
          .map((c) => ({ c, key: rand() + 1.5 * (recency.get(c.code) ?? 0) + 0.15 * (fresh.mastery[c.code] ?? 0) }))
          .sort((a, b) => b.key - a.key)
          .map((x) => x.c)
      : shuffle(list, rand);
  const decks = new Map<QuestionKind, Country[]>();
  const questions: Question[] = [];
  // Avoid repeating a country until each kind's pool runs out (matters in "mix", where pools overlap).
  let used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const kind = mode === "mix" ? KINDS[Math.floor(rand() * KINDS.length)] : mode;
    let deck = decks.get(kind)?.filter((c) => !used.has(c.code));
    if (!deck?.length) {
      deck = order(pool(kind, scope, difficulty)).filter((c) => !used.has(c.code));
      if (!deck.length) {
        used = new Set();
        deck = order(pool(kind, scope, difficulty));
      }
    }
    decks.set(kind, deck);
    const country = deck.pop() as Country;
    used.add(country.code);
    const options = kind === "map" || kind === "name" ? [] : shuffle([country, ...distractors(country, kind, difficulty, rand)], rand);
    questions.push({ kind, country, options });
  }
  return questions;
}

export function streakMultiplier(streak: number) {
  return streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
}

/**
 * Points for one answer: base + speed bonus, multiplied by streak and difficulty.
 * Map Hunt gives partial credit for a close miss.
 */
export function scoreAnswer(opts: {
  question: Question;
  picked: Country | null;
  ms: number;
  difficulty: Difficulty;
  streak: number;
}): Answer {
  const { question, picked, ms, difficulty, streak } = opts;
  const limit = timeLimitMs(question.kind, difficulty);
  const correct = picked?.code === question.country.code;
  const mult = DIFFICULTY[difficulty].mult;
  if (correct) {
    const speed = Math.max(0, 1 - ms / limit);
    const base = question.kind === "name" ? 150 : 100; // typing the name is harder than picking it
    const points = Math.round((base + 100 * speed) * mult * streakMultiplier(streak + 1));
    return { correct, points, ms, pickedCode: picked?.code };
  }
  if (question.kind === "map" && picked) {
    const km = distanceKm(picked, question.country);
    const points = km < 1500 ? Math.round((1 - km / 1500) * 50 * mult) : 0;
    return { correct, points, ms, distanceKm: km, pickedCode: picked.code };
  }
  return { correct: false, points: 0, ms, pickedCode: picked?.code };
}
