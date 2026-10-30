import { QUIZ_COUNTRIES, type Scope } from "./countries";
import type { Answer, Difficulty, Mode, Question } from "./game";
import { randomAvatar, randomNickname } from "./identity";

export type Profile = {
  name: string;
  avatar: string;
  xp: number;
  coins: number;
  gamesPlayed: number;
  totalCorrect: number;
  flagCorrect: number;
  mapCorrect: number;
  capitalCorrect: number;
  tinyCorrect: number;
  bestStreak: number;
  perfectRounds: number;
  duelsPlayed: number;
  onlineGames: number;
  onlineWins: number;
  challengesWon: number;
  dailyLast: string | null;
  dailyStreak: number;
  badges: string[];
  /** 0–5 per country code; goes up on correct answers, down on misses. */
  mastery: Record<string, number>;
  /** Best score per "mode|scope|difficulty". */
  best: Record<string, number>;
  /** Name Them All: most countries typed per "scope|minutes" (0 minutes = no timer). */
  allBest: Record<string, number>;
  muted: boolean;
  lang: "en" | "fr";
};

const KEY = "atlas-quest-profile-v1";

export function newProfile(): Profile {
  return {
    name: randomNickname(),
    avatar: randomAvatar(),
    xp: 0,
    coins: 100,
    gamesPlayed: 0,
    totalCorrect: 0,
    flagCorrect: 0,
    mapCorrect: 0,
    capitalCorrect: 0,
    tinyCorrect: 0,
    bestStreak: 0,
    perfectRounds: 0,
    duelsPlayed: 0,
    onlineGames: 0,
    onlineWins: 0,
    challengesWon: 0,
    dailyLast: null,
    dailyStreak: 0,
    badges: [],
    mastery: {},
    best: {},
    allBest: {},
    muted: false,
    lang: typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en",
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
  [1, "Rookie", "🎒"],
  [3, "Explorer", "🧭"],
  [6, "Navigator", "⛵"],
  [10, "Legend", "🏆"],
  [15, "World Master", "👑"],
];

export function rankFor(level: number) {
  let rank = RANKS[0];
  for (const r of RANKS) if (level >= r[0]) rank = r;
  return { title: rank[1], emoji: rank[2] };
}

// --- Badges -----------------------------------------------------------------

export type Badge = { id: string; emoji: string; name: string; how: string; earned: (p: Profile) => boolean };

const worldBest = (p: Profile) =>
  Math.max(0, ...Object.entries(p.allBest ?? {}).filter(([k]) => k.startsWith("World|")).map(([, v]) => v));

const continentDone = (p: Profile, region: string) =>
  QUIZ_COUNTRIES.filter((c) => c.region === region).every((c) => (p.mastery[c.code] ?? 0) >= 1);

export const BADGES: Badge[] = [
  { id: "first", emoji: "🚀", name: "Lift Off", how: "Finish your first game", earned: (p) => p.gamesPlayed >= 1 },
  { id: "streak5", emoji: "🔥", name: "On Fire", how: "5 right in a row", earned: (p) => p.bestStreak >= 5 },
  { id: "streak10", emoji: "☄️", name: "Unstoppable", how: "10 right in a row", earned: (p) => p.bestStreak >= 10 },
  { id: "streak25", emoji: "🌋", name: "Volcanic", how: "25 right in a row", earned: (p) => p.bestStreak >= 25 },
  { id: "perfect", emoji: "💯", name: "Perfect Round", how: "Get every question right", earned: (p) => p.perfectRounds >= 1 },
  { id: "flags100", emoji: "🏳️", name: "Flag Master", how: "100 flags right", earned: (p) => p.flagCorrect >= 100 },
  { id: "map100", emoji: "🗺️", name: "Cartographer", how: "Find 100 countries on the map", earned: (p) => p.mapCorrect >= 100 },
  { id: "caps50", emoji: "🏛️", name: "Capital Genius", how: "50 capitals right", earned: (p) => p.capitalCorrect >= 50 },
  { id: "tiny", emoji: "🔍", name: "Island Hopper", how: "Find 10 tiny countries", earned: (p) => p.tinyCorrect >= 10 },
  { id: "daily7", emoji: "📅", name: "Week Warrior", how: "7-day daily streak", earned: (p) => p.dailyStreak >= 7 },
  { id: "duel", emoji: "⚔️", name: "Duelist", how: "Play a duel", earned: (p) => p.duelsPlayed >= 1 },
  { id: "online", emoji: "🌐", name: "Online Rival", how: "Play an online room", earned: (p) => p.onlineGames >= 1 },
  { id: "champ", emoji: "🥇", name: "Champion", how: "Win an online room", earned: (p) => p.onlineWins >= 1 },
  { id: "challenger", emoji: "🎯", name: "Challenger", how: "Beat a friend's challenge", earned: (p) => p.challengesWon >= 1 },
  { id: "africa", emoji: "🦁", name: "Africa Ace", how: "Get every African country right once", earned: (p) => continentDone(p, "Africa") },
  { id: "americas", emoji: "🗽", name: "Americas Ace", how: "Get every country in the Americas right once", earned: (p) => continentDone(p, "Americas") },
  { id: "asia", emoji: "🐉", name: "Asia Ace", how: "Get every Asian country right once", earned: (p) => continentDone(p, "Asia") },
  { id: "europe", emoji: "🏰", name: "Europe Ace", how: "Get every European country right once", earned: (p) => continentDone(p, "Europe") },
  { id: "oceania", emoji: "🏝️", name: "Oceania Ace", how: "Get every Oceania country right once", earned: (p) => continentDone(p, "Oceania") },
  { id: "level10", emoji: "🏆", name: "Legend", how: "Reach level 10", earned: (p) => levelFromXp(p.xp).level >= 10 },
  { id: "half", emoji: "⌨️", name: "Half the World", how: "Type 100 countries in one World game", earned: (p) => worldBest(p) >= 100 },
  { id: "all", emoji: "🌍", name: "Know-It-All", how: "Type all 195 countries in one World game", earned: (p) => worldBest(p) >= QUIZ_COUNTRIES.length },
];

// --- Applying a finished round ----------------------------------------------

export type RoundResult = {
  mode: Mode;
  scope: Scope;
  difficulty: Difficulty;
  questions: Question[];
  answers: Answer[];
  score: number;
  bestStreak: number;
  daily?: boolean;
  /** Round with a fixed length where a perfect score is possible. */
  fixedLength?: boolean;
};

export type Rewards = { xp: number; coins: number; newBadges: Badge[]; leveledUp: boolean; newBest: boolean };

export function bestKey(mode: Mode, scope: Scope, difficulty: Difficulty, endless = false) {
  return `${mode}|${scope}|${difficulty}${endless ? "|survival" : ""}`;
}

export function applyRound(
  profile: Profile,
  r: RoundResult,
  extra: Partial<Pick<Profile, "duelsPlayed" | "onlineGames" | "onlineWins" | "challengesWon">> = {},
  endless = false,
): { profile: Profile; rewards: Rewards } {
  const p: Profile = { ...profile, mastery: { ...profile.mastery }, best: { ...profile.best } };
  const correct = r.answers.filter((a) => a.correct).length;
  r.answers.forEach((a, i) => {
    const q = r.questions[i];
    const code = q.country.code;
    p.mastery[code] = Math.max(0, Math.min(5, (p.mastery[code] ?? 0) + (a.correct ? 1 : -1)));
    if (!a.correct) return;
    if (q.kind === "map") {
      p.mapCorrect++;
      if (q.country.area < 2000) p.tinyCorrect++;
    } else if (q.kind === "capital") p.capitalCorrect++;
    else p.flagCorrect++;
  });
  p.totalCorrect += correct;
  p.gamesPlayed++;
  p.bestStreak = Math.max(p.bestStreak, r.bestStreak);
  if (r.fixedLength && correct === r.answers.length && r.answers.length >= 10) p.perfectRounds++;

  if (r.daily) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (p.dailyLast !== today) p.dailyStreak = p.dailyLast === yesterday ? p.dailyStreak + 1 : 1;
    p.dailyLast = today;
  }
  for (const [k, v] of Object.entries(extra) as [keyof typeof extra, number | undefined][]) p[k] += v ?? 0;

  const key = bestKey(r.mode, r.scope, r.difficulty, endless);
  const newBest = r.score > (p.best[key] ?? 0);
  if (newBest) p.best[key] = r.score;

  const xp = Math.round(r.score / 10) + correct * 5;
  const coins = correct * 2 + (r.daily ? 25 : 0) + (newBest ? 10 : 0);
  const before = levelFromXp(p.xp).level;
  p.xp += xp;
  p.coins += coins;
  const leveledUp = levelFromXp(p.xp).level > before;
  if (leveledUp) p.coins += 50;

  const newBadges = BADGES.filter((b) => !p.badges.includes(b.id) && b.earned(p));
  p.badges = [...p.badges, ...newBadges.map((b) => b.id)];
  return { profile: p, rewards: { xp, coins: coins + (leveledUp ? 50 : 0), newBadges, leveledUp, newBest } };
}

// --- Name Them All ------------------------------------------------------------

export function allBestKey(scope: Scope, minutes: number) {
  return `${scope}|${minutes}`;
}

/** Saves a Name Them All game: XP and coins per country, mastery for each one typed, records and badges. */
export function applyNameAll(
  profile: Profile,
  r: { scope: Scope; minutes: number; found: string[] },
): { profile: Profile; rewards: Rewards } {
  const p: Profile = { ...profile, mastery: { ...profile.mastery }, allBest: { ...profile.allBest } };
  for (const code of r.found) p.mastery[code] = Math.min(5, (p.mastery[code] ?? 0) + 1);
  p.gamesPlayed++;
  p.totalCorrect += r.found.length;
  const key = allBestKey(r.scope, r.minutes);
  const newBest = r.found.length > (p.allBest[key] ?? 0);
  if (newBest) p.allBest[key] = r.found.length;

  const xp = r.found.length * 4;
  const coins = r.found.length + (newBest ? 10 : 0);
  const before = levelFromXp(p.xp).level;
  p.xp += xp;
  p.coins += coins;
  const leveledUp = levelFromXp(p.xp).level > before;
  if (leveledUp) p.coins += 50;

  const newBadges = BADGES.filter((b) => !p.badges.includes(b.id) && b.earned(p));
  p.badges = [...p.badges, ...newBadges.map((b) => b.id)];
  return { profile: p, rewards: { xp, coins: coins + (leveledUp ? 50 : 0), newBadges, leveledUp, newBest } };
}
