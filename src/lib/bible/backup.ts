import { BOOK_BY_ID, SCOPES, SECTIONS, type SectionId } from "./books";
import { DIFFICULTY, MODES } from "./game";
import { BADGES, type Profile, newProfile } from "./progress";

// Save codes: the whole profile packed into a copy-pasteable string, so progress can move
// between devices without accounts. Format: "BQ1z." + base64url(deflate(JSON)), or "BQ1j."
// + base64url(JSON) on browsers without CompressionStream.

const COUNTERS = ["xp", "coins", "gamesPlayed", "totalCorrect", "bestStreak", "perfectRounds", "shelvesBuilt", "dailyStreak", "shields"] as const satisfies readonly (keyof Profile)[];

const MAX_COUNTER = 100_000_000;

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function exportProfile(p: Profile): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ ...p, muted: undefined })); // sound setting is per device
  if (typeof CompressionStream !== "undefined") {
    return `BQ1z.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
  }
  return `BQ1j.${toBase64Url(json)}`;
}

/** Reads a save code. Returns null for anything that isn't a valid code; unknown fields are dropped. */
export async function importProfile(code: string): Promise<Profile | null> {
  try {
    const clean = code.replace(/\s+/g, "");
    const match = /^BQ1([zj])\.([A-Za-z0-9_-]+)$/.exec(clean);
    if (!match) return null;
    let bytes = fromBase64Url(match[2]);
    if (match[1] === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

function sanitize(raw: unknown): Profile | null {
  if (!isObj(raw)) return null;
  const p = newProfile();
  const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(MAX_COUNTER, Math.floor(v))) : 0);
  for (const k of COUNTERS) p[k] = count(raw[k]);
  if (raw.lang === "en" || raw.lang === "fr" || raw.lang === "pt") p.lang = raw.lang;
  if (typeof raw.dailyLast === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.dailyLast)) p.dailyLast = raw.dailyLast;
  p.grandDone = raw.grandDone === true;
  if (Array.isArray(raw.badges)) p.badges = BADGES.map((b) => b.id).filter((id) => (raw.badges as unknown[]).includes(id));
  if (isObj(raw.mastery)) for (const [id, level] of Object.entries(raw.mastery)) if (BOOK_BY_ID.has(id)) p.mastery[id] = Math.min(5, count(level));
  if (isObj(raw.best)) {
    for (const [key, score] of Object.entries(raw.best)) {
      const [mode, scope, diff, extra, ...rest] = key.split("|");
      const valid =
        MODES.some((m) => m.id === mode) &&
        (SCOPES as string[]).includes(scope) &&
        diff in DIFFICULTY &&
        (extra === undefined || extra === "survival") &&
        rest.length === 0;
      if (valid) p.best[key] = count(score);
    }
  }
  for (const field of ["typeBest", "typeFastest"] as const) {
    const v = raw[field];
    if (isObj(v)) for (const [scope, n] of Object.entries(v)) if ((SCOPES as string[]).includes(scope) && count(n) > 0) p[field][scope] = count(n);
  }
  if (isObj(raw.quest)) {
    for (const s of SECTIONS) {
      const q = raw.quest[s.id];
      if (isObj(q)) p.quest[s.id as SectionId] = { learn: q.learn === true, practice: q.practice === true, stars: Math.min(3, count(q.stars)) };
    }
  }
  return p;
}

/**
 * Combines a restored save with this device's progress without losing anything:
 * the higher value of every counter, every badge, the best mastery per book, the best of each island.
 * Language and sound settings stay as they are on this device.
 */
export function mergeProfiles(current: Profile, restored: Profile): Profile {
  const p: Profile = {
    ...current,
    mastery: { ...current.mastery },
    best: { ...current.best },
    typeBest: { ...current.typeBest },
    typeFastest: { ...current.typeFastest },
    quest: { ...current.quest },
  };
  for (const k of COUNTERS) p[k] = Math.max(current[k], restored[k]);
  // The daily streak belongs to whichever save played most recently.
  if ((restored.dailyLast ?? "") > (current.dailyLast ?? "")) {
    p.dailyLast = restored.dailyLast;
    p.dailyStreak = restored.dailyStreak;
  } else if (restored.dailyLast !== current.dailyLast) {
    p.dailyStreak = current.dailyStreak;
  }
  p.grandDone = current.grandDone || restored.grandDone;
  p.badges = BADGES.map((b) => b.id).filter((id) => current.badges.includes(id) || restored.badges.includes(id));
  for (const [id, level] of Object.entries(restored.mastery)) p.mastery[id] = Math.max(p.mastery[id] ?? 0, level);
  for (const [key, score] of Object.entries(restored.best)) p.best[key] = Math.max(p.best[key] ?? 0, score);
  for (const [key, n] of Object.entries(restored.typeBest)) p.typeBest[key] = Math.max(p.typeBest[key] ?? 0, n);
  for (const [key, s] of Object.entries(restored.typeFastest)) p.typeFastest[key] = Math.min(p.typeFastest[key] ?? Infinity, s);
  for (const [id, q] of Object.entries(restored.quest) as [SectionId, NonNullable<Profile["quest"][SectionId]>][]) {
    const c = p.quest[id];
    p.quest[id] = c ? { learn: c.learn || q.learn, practice: c.practice || q.practice, stars: Math.max(c.stars, q.stars) } : q;
  }
  return p;
}
