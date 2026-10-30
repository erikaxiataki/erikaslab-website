import { BOOKS, type Book, SECTIONS, type Scope, booksIn } from "./books";

export type QuestionKind = "next" | "before" | "missing" | "who" | "section" | "testament";
export type Mode = QuestionKind | "mix";
export type Difficulty = "easy" | "normal" | "hard";

export const MODES: { id: Mode; label: string; emoji: string; blurb: string }[] = [
  { id: "next", label: "What Comes Next?", emoji: "👉", blurb: "Pick the book that comes right after" },
  { id: "before", label: "What Came Before?", emoji: "👈", blurb: "Pick the book that comes right before" },
  { id: "missing", label: "Missing Book", emoji: "🧩", blurb: "Find the gap in the row of books" },
  { id: "who", label: "Which Book?", emoji: "🔎", blurb: "Read the story clue, find the book" },
  { id: "section", label: "Section Sorter", emoji: "🗂️", blurb: "Which part of the Bible is it in?" },
  { id: "testament", label: "Old or New?", emoji: "⚡", blurb: "Old Testament or New Testament? Fast!" },
  { id: "mix", label: "Mix It Up", emoji: "🎲", blurb: "A bit of everything" },
];

export const DIFFICULTY: Record<Difficulty, { label: string; emoji: string; seconds: number; lives: number; mult: number; shelf: number }> = {
  easy: { label: "Easy", emoji: "🟢", seconds: 25, lives: 3, mult: 1, shelf: 5 },
  normal: { label: "Normal", emoji: "🟡", seconds: 15, lives: 3, mult: 1.5, shelf: 8 },
  hard: { label: "Hard", emoji: "🔴", seconds: 8, lives: 1, mult: 2.5, shelf: 12 },
};

/** "Old or New?" is a speed game, so it gets less time. */
export function timeLimitMs(kind: QuestionKind, difficulty: Difficulty) {
  const s = DIFFICULTY[difficulty].seconds;
  return (kind === "testament" ? Math.ceil(s / 2) : kind === "who" ? s + 5 : s) * 1000;
}

export type Question = {
  kind: QuestionKind;
  /** The book being learned: its mastery goes up or down with the answer. */
  book: Book;
  /** next/before: the book shown in the question. */
  clue?: Book;
  /** missing: a row of books with one gap (null). */
  row?: (Book | null)[];
  /** Book ids, section ids or "OT"/"NT". */
  options: string[];
  answer: string;
};

export type Answer = { correct: boolean; points: number; ms: number; picked?: string };

/** Small, fast, seedable PRNG so a daily challenge is the same for everyone. */
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
  const d = date.toISOString().slice(0, 10).replace(/-/g, "");
  return (Number(d) * 2654435761) >>> 0;
}

export function shuffle<T>(arr: T[], rand: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weighted pick: books you know less well come up more often (simple spaced repetition). */
function pickWeighted(books: Book[], rand: () => number, mastery: Record<string, number>, avoid: Set<string>) {
  const pool = books.filter((b) => !avoid.has(b.id));
  const list = pool.length ? pool : books;
  const weights = list.map((b) => 6 - Math.min(5, mastery[b.id] ?? 0));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

/**
 * Three wrong book choices. Harder levels use the books closest to the answer,
 * which are the ones that are easy to mix up.
 */
function bookDistractors(answer: Book, scopeBooks: Book[], difficulty: Difficulty, rand: () => number, exclude: string[] = []) {
  const keep = (b: Book) => b.id !== answer.id && !exclude.includes(b.id);
  // Stay inside the scope when it has enough books, so wrong choices can't be ruled out at a glance.
  const fromScope = scopeBooks.filter(keep);
  const others = fromScope.length >= 3 ? fromScope : BOOKS.filter(keep);
  const near = [...others].sort((a, b) => Math.abs(a.order - answer.order) - Math.abs(b.order - answer.order));
  const pool = difficulty === "easy" ? shuffle(others, rand) : shuffle(near.slice(0, difficulty === "hard" ? 4 : 7), rand);
  return pool.slice(0, 3);
}

const KINDS: QuestionKind[] = ["next", "before", "missing", "who", "section", "testament"];

export function makeQuestion(
  kind: QuestionKind,
  scope: Scope,
  difficulty: Difficulty,
  rand: () => number,
  mastery: Record<string, number>,
  avoid: Set<string>,
): Question {
  const books = booksIn(scope);
  const inScopeIds = new Set(books.map((b) => b.id));
  switch (kind) {
    case "next":
    case "before": {
      // The answer must have a neighbor inside the scope, so it can be learned in context.
      const candidates = books.filter((b) => {
        const n = BOOKS[b.order - 1 + (kind === "next" ? -1 : 1)];
        return n && inScopeIds.has(n.id);
      });
      const book = pickWeighted(candidates, rand, mastery, avoid);
      const clue = BOOKS[book.order - 1 + (kind === "next" ? -1 : 1)];
      const options = shuffle([book, ...bookDistractors(book, books, difficulty, rand, [clue.id])], rand).map((b) => b.id);
      return { kind, book, clue, options, answer: book.id };
    }
    case "missing": {
      const len = Math.min(5, books.length);
      const book = pickWeighted(books, rand, mastery, avoid);
      // A run of `len` books in scope that contains the answer (scopes are contiguous).
      const idx = books.indexOf(book);
      const start = Math.max(0, Math.min(books.length - len, idx - Math.floor(rand() * len)));
      const row = books.slice(start, start + len).map((b) => (b.id === book.id ? null : b));
      const options = shuffle([book, ...bookDistractors(book, books, difficulty, rand, books.slice(start, start + len).map((b) => b.id))], rand).map((b) => b.id);
      return { kind, book, row, options, answer: book.id };
    }
    case "who": {
      const book = pickWeighted(books, rand, mastery, avoid);
      const options = shuffle([book, ...bookDistractors(book, books, difficulty === "hard" ? "hard" : "easy", rand)], rand).map((b) => b.id);
      return { kind, book, options, answer: book.id };
    }
    case "section": {
      const book = pickWeighted(books, rand, mastery, avoid);
      // All the bins of the book's testament, in Bible order: the player learns where each part sits.
      const options = SECTIONS.filter((s) => s.testament === book.testament).map((s) => s.id);
      return { kind, book, options, answer: book.section };
    }
    case "testament": {
      const book = pickWeighted(books, rand, mastery, avoid);
      return { kind, book, options: ["OT", "NT"], answer: book.testament };
    }
  }
}

/** Kinds that make sense for a scope ("Old or New?" is pointless when everything is from one testament). */
export function kindsFor(mode: Mode, scope: Scope): QuestionKind[] {
  const singleTestament = scope !== "all";
  const singleSection = singleTestament && scope !== "OT" && scope !== "NT";
  if (mode !== "mix") return [mode];
  return KINDS.filter((k) => !(k === "testament" && singleTestament) && !(k === "section" && singleSection));
}

export function makeQuestions(
  mode: Mode,
  scope: Scope,
  difficulty: Difficulty,
  seed: number,
  count: number,
  mastery: Record<string, number> = {},
): Question[] {
  const rand = mulberry32(seed);
  const kinds = kindsFor(mode, scope);
  const used = new Set<string>();
  const out: Question[] = [];
  while (out.length < count) {
    const kind = kinds[Math.floor(rand() * kinds.length)];
    const q = makeQuestion(kind, scope, difficulty, rand, mastery, used);
    used.add(q.book.id);
    if (used.size >= booksIn(scope).length) used.clear();
    out.push(q);
  }
  return out;
}

/** Points for a right answer: speed bonus, combo multiplier, difficulty multiplier. */
export function scoreFor(ms: number, limitMs: number, streak: number, difficulty: Difficulty) {
  const speed = Math.max(0, 1 - ms / limitMs);
  const combo = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
  return Math.round((100 + speed * 50) * combo * DIFFICULTY[difficulty].mult);
}

export function comboFor(streak: number) {
  return streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
}
