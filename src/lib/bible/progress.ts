import { BOOKS, type Lang, SECTIONS, type Scope, type SectionId, booksIn } from "./books";
import type { Answer, Difficulty, Mode, Question } from "./game";

export type IslandProgress = { learn: boolean; practice: boolean; stars: number };

export type Profile = {
  xp: number;
  coins: number;
  gamesPlayed: number;
  totalCorrect: number;
  bestStreak: number;
  perfectRounds: number;
  shelvesBuilt: number;
  dailyLast: string | null;
  dailyStreak: number;
  /** Streak shields: each one saves the daily streak once when a day is missed. */
  shields: number;
  badges: string[];
  /** 0–5 per book id; goes up on right answers, down on misses. */
  mastery: Record<string, number>;
  /** Best score per "mode|scope|difficulty". */
  best: Record<string, number>;
  /** Type Them All: most books typed in order per scope, and fastest full run in seconds. */
  typeBest: Record<string, number>;
  typeFastest: Record<string, number>;
  /** Quest Map progress per island (section). */
  quest: Partial<Record<SectionId, IslandProgress>>;
  /** The Grand Library (all 66 on the shelf) is done. */
  grandDone: boolean;
  muted: boolean;
  lang: Lang;
  /** The player has picked a language on the landing page at least once. */
  langChosen: boolean;
};

const KEY = "bible-quest-profile-v1";

/** Start in the browser's language when it is French or Portuguese. */
function startLang(): Lang {
  const l = typeof navigator !== "undefined" ? navigator.language?.toLowerCase() ?? "" : "";
  return l.startsWith("fr") ? "fr" : l.startsWith("pt") ? "pt" : "en";
}

export function newProfile(): Profile {
  return {
    xp: 0,
    coins: 50,
    gamesPlayed: 0,
    totalCorrect: 0,
    bestStreak: 0,
    perfectRounds: 0,
    shelvesBuilt: 0,
    dailyLast: null,
    dailyStreak: 0,
    shields: 0,
    badges: [],
    mastery: {},
    best: {},
    typeBest: {},
    typeFastest: {},
    quest: {},
    grandDone: false,
    muted: false,
    lang: typeof window === "undefined" ? "en" : startLang(),
    langChosen: false,
  };
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...newProfile(), ...JSON.parse(raw) };
  } catch {
    // Private mode or blocked storage: play with a fresh profile.
  }
  return newProfile();
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Ignore: progress just won't persist.
  }
}

// --- Levels -----------------------------------------------------------------

export function levelFromXp(xp: number) {
  // Each level needs 150 XP more than the last: 150, 300, 450...
  let level = 1;
  let need = 150;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need = 150 * level;
  }
  return { level, into: rest, need };
}

const RANKS: [number, string, string][] = [
  [1, "Scroll Seeker", "📜"],
  [3, "Page Turner", "📖"],
  [6, "Scribe", "✒️"],
  [10, "Scholar", "🎓"],
  [15, "Sage", "🦉"],
];

export function rankFor(level: number) {
  let rank = RANKS[0];
  for (const r of RANKS) if (level >= r[0]) rank = r;
  return { title: rank[1], emoji: rank[2] };
}

/** A book is "on the shelf" in the Library once its mastery reaches this. */
export const MASTERED = 3;

export function masteredCount(p: Profile, scope: Scope = "all") {
  return booksIn(scope).filter((b) => (p.mastery[b.id] ?? 0) >= MASTERED).length;
}

// --- Quest Map ----------------------------------------------------------------

export function islandDone(p: Profile, id: SectionId) {
  return (p.quest[id]?.stars ?? 0) > 0;
}

/** Islands open one after another; the first is always open. */
export function islandOpen(p: Profile, id: SectionId) {
  const i = SECTIONS.findIndex((s) => s.id === id);
  return i === 0 || islandDone(p, SECTIONS[i - 1].id);
}

export function questDone(p: Profile) {
  return SECTIONS.every((s) => islandDone(p, s.id));
}

// --- Badges -----------------------------------------------------------------

export type Badge = { id: string; emoji: string; name: string; how: string; earned: (p: Profile) => boolean };

export const BADGES: Badge[] = [
  { id: "first", emoji: "🚀", name: "First Steps", how: "Finish your first game", earned: (p) => p.gamesPlayed >= 1 },
  { id: "streak5", emoji: "🔥", name: "On Fire", how: "5 right in a row", earned: (p) => p.bestStreak >= 5 },
  { id: "streak15", emoji: "☄️", name: "Unstoppable", how: "15 right in a row", earned: (p) => p.bestStreak >= 15 },
  { id: "perfect", emoji: "💯", name: "Perfect Round", how: "Get every question right", earned: (p) => p.perfectRounds >= 1 },
  { id: "shelf", emoji: "📚", name: "Shelf Builder", how: "Build 10 bookshelves", earned: (p) => p.shelvesBuilt >= 10 },
  { id: "torah", emoji: "📜", name: "Torah Master", how: "Finish the Law island", earned: (p) => islandDone(p, "law") },
  { id: "minor", emoji: "📯", name: "Twelve Trumpets", how: "Finish the Minor Prophets island", earned: (p) => islandDone(p, "minor") },
  { id: "gospel", emoji: "✝️", name: "Good News", how: "Finish the Gospels & Acts island", earned: (p) => islandDone(p, "gospels") },
  { id: "mail", emoji: "✉️", name: "Paul's Mail Carrier", how: "Finish the Paul's Letters island", earned: (p) => islandDone(p, "paul") },
  { id: "quest", emoji: "🗺️", name: "Island Hopper", how: "Finish all 8 islands", earned: questDone },
  { id: "grand", emoji: "🏛️", name: "Grand Librarian", how: "Put all 66 books back in the Great Library", earned: (p) => p.grandDone },
  { id: "typeOT", emoji: "⌨️", name: "Old Testament Typist", how: "Type all 39 Old Testament books in order", earned: (p) => (p.typeBest.OT ?? 0) >= 39 },
  { id: "typeNT", emoji: "🖊️", name: "New Testament Typist", how: "Type all 27 New Testament books in order", earned: (p) => (p.typeBest.NT ?? 0) >= 27 },
  { id: "perfect66", emoji: "🏆", name: "Perfect 66", how: "Type all 66 books in order", earned: (p) => (p.typeBest.all ?? 0) >= 66 },
  { id: "daily7", emoji: "📅", name: "Week Warrior", how: "7-day daily streak", earned: (p) => p.dailyStreak >= 7 },
  { id: "half", emoji: "🌓", name: "Half the Library", how: "Master 33 books", earned: (p) => masteredCount(p) >= 33 },
  { id: "all", emoji: "🌕", name: "Whole Library", how: "Master all 66 books", earned: (p) => masteredCount(p) >= BOOKS.length },
  { id: "level10", emoji: "🎓", name: "Scholar", how: "Reach level 10", earned: (p) => levelFromXp(p.xp).level >= 10 },
];

// --- Rewards ------------------------------------------------------------------

export type Rewards = { xp: number; coins: number; newBadges: Badge[]; leveledUp: boolean; newBest: boolean };

function finishRewards(before: Profile, p: Profile, xp: number, coins: number, newBest: boolean): { profile: Profile; rewards: Rewards } {
  const lvl = levelFromXp(before.xp).level;
  p.xp += xp;
  p.coins += coins;
  const leveledUp = levelFromXp(p.xp).level > lvl;
  if (leveledUp) p.coins += 50;
  const newBadges = BADGES.filter((b) => !p.badges.includes(b.id) && b.earned(p));
  p.badges = [...p.badges, ...newBadges.map((b) => b.id)];
  return { profile: p, rewards: { xp, coins: coins + (leveledUp ? 50 : 0), newBadges, leveledUp, newBest } };
}

function clone(p: Profile): Profile {
  return {
    ...p,
    mastery: { ...p.mastery },
    best: { ...p.best },
    typeBest: { ...p.typeBest },
    typeFastest: { ...p.typeFastest },
    quest: { ...p.quest },
  };
}

function bump(p: Profile, id: string, by: number) {
  p.mastery[id] = Math.max(0, Math.min(5, (p.mastery[id] ?? 0) + by));
}

const day = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

/** Updates the daily streak. A missed day uses a streak shield if there is one. */
function markDaily(p: Profile) {
  const today = day();
  if (p.dailyLast === today) return;
  if (p.dailyLast === day(-1)) p.dailyStreak++;
  else if (p.dailyLast === day(-2) && p.shields > 0) {
    p.shields--;
    p.dailyStreak++;
  } else p.dailyStreak = 1;
  p.dailyLast = today;
}

export type RoundResult = {
  mode: Mode;
  scope: Scope;
  difficulty: Difficulty;
  questions: Question[];
  answers: Answer[];
  score: number;
  bestStreak: number;
  daily?: boolean;
  survival?: boolean;
  /** A Quest Map practice round for this island. */
  island?: SectionId;
};

export function bestKey(mode: Mode, scope: Scope, difficulty: Difficulty, survival = false) {
  return `${mode}|${scope}|${difficulty}${survival ? "|survival" : ""}`;
}

/** Practice rounds on the Quest Map pass with this share of right answers. */
export const PRACTICE_PASS = 0.75;

export function applyRound(profile: Profile, r: RoundResult) {
  const p = clone(profile);
  const correct = r.answers.filter((a) => a.correct).length;
  r.answers.forEach((a, i) => bump(p, r.questions[i].book.id, a.correct ? 1 : -1));
  p.totalCorrect += correct;
  p.gamesPlayed++;
  p.bestStreak = Math.max(p.bestStreak, r.bestStreak);
  if (!r.survival && r.answers.length >= 8 && correct === r.answers.length) p.perfectRounds++;
  if (r.daily) markDaily(p);
  if (r.island && correct >= r.answers.length * PRACTICE_PASS) {
    const isl = p.quest[r.island] ?? { learn: false, practice: false, stars: 0 };
    p.quest[r.island] = { ...isl, practice: true };
  }
  const key = bestKey(r.mode, r.scope, r.difficulty, r.survival);
  const newBest = !r.island && r.score > (p.best[key] ?? 0);
  if (newBest) p.best[key] = r.score;
  const xp = Math.round(r.score / 10) + correct * 5;
  const coins = correct * 2 + (r.daily ? 25 : 0) + (newBest ? 10 : 0);
  return finishRewards(profile, p, xp, coins, newBest);
}

/** Stars for a finished bookshelf: 3 with no mistakes, 2 with one or two, 1 otherwise. */
export function shelfStars(mistakes: number) {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}

export function applyShelf(
  profile: Profile,
  r: { bookIds: string[]; mistakes: number; seconds: number; island?: SectionId; grand?: boolean },
) {
  const p = clone(profile);
  const stars = shelfStars(r.mistakes);
  for (const id of r.bookIds) bump(p, id, 1);
  p.gamesPlayed++;
  p.shelvesBuilt++;
  p.totalCorrect += r.bookIds.length;
  if (r.island) {
    const isl = p.quest[r.island] ?? { learn: false, practice: false, stars: 0 };
    p.quest[r.island] = { ...isl, stars: Math.max(isl.stars, stars) };
  }
  if (r.grand) p.grandDone = true;
  const xp = r.bookIds.length * 6 * stars;
  const coins = r.bookIds.length + stars * 5 + (r.island || r.grand ? 20 : 0);
  return { ...finishRewards(profile, p, xp, coins, false), stars };
}

export function applyTypeAll(profile: Profile, r: { scope: Scope; typed: string[]; seconds: number; complete: boolean }) {
  const p = clone(profile);
  for (const id of r.typed) bump(p, id, 1);
  p.gamesPlayed++;
  p.totalCorrect += r.typed.length;
  let newBest = r.typed.length > (p.typeBest[r.scope] ?? 0);
  if (newBest) p.typeBest[r.scope] = r.typed.length;
  if (r.complete && r.seconds < (p.typeFastest[r.scope] ?? Infinity)) {
    p.typeFastest[r.scope] = r.seconds;
    newBest = true;
  }
  return finishRewards(profile, p, r.typed.length * 5, r.typed.length + (newBest ? 10 : 0), newBest);
}

export function markLearned(profile: Profile, island: SectionId) {
  const p = clone(profile);
  const isl = p.quest[island] ?? { learn: false, practice: false, stars: 0 };
  const first = !isl.learn;
  p.quest[island] = { ...isl, learn: true };
  // Meeting the books gives every one of them a first star.
  if (first) for (const b of booksIn(island)) p.mastery[b.id] = Math.max(1, p.mastery[b.id] ?? 0);
  return finishRewards(profile, p, first ? 30 : 0, first ? 10 : 0, false);
}

export const SHIELD_COST = 40;
export const HINT_COST = 5;
