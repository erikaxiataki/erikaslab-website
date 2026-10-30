import { BY_CODE, SCOPES } from "./countries";
import { DIFFICULTY, MODES } from "./game";
import { isSafeAvatar, isSafeNickname } from "./identity";
import { BADGES, type Profile, newProfile } from "./progress";

// Save codes: the whole profile packed into a copy-pasteable string, so progress can move
// between devices without accounts. Format: "AQ1z." + base64url(deflate(JSON)), or "AQ1j."
// + base64url(JSON) on browsers without CompressionStream.

const COUNTERS = [
  "xp", "coins", "gamesPlayed", "totalCorrect", "flagCorrect", "mapCorrect", "capitalCorrect", "tinyCorrect",
  "bestStreak", "perfectRounds", "duelsPlayed", "onlineGames", "onlineWins", "challengesWon", "dailyStreak",
] as const satisfies readonly (keyof Profile)[];

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
    return `AQ1z.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
  }
  return `AQ1j.${toBase64Url(json)}`;
}

/** Reads a save code. Returns null for anything that isn't a valid code; unknown fields are dropped. */
export async function importProfile(code: string): Promise<Profile | null> {
  try {
    const clean = code.replace(/\s+/g, "");
    const match = /^AQ1([zj])\.([A-Za-z0-9_-]+)$/.exec(clean);
    if (!match) return null;
    let bytes = fromBase64Url(match[2]);
    if (match[1] === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

function sanitize(raw: unknown): Profile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const p = newProfile();
  const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(MAX_COUNTER, Math.floor(v))) : 0);
  for (const k of COUNTERS) p[k] = count(r[k]);
  if (isSafeNickname(r.name)) p.name = r.name;
  if (isSafeAvatar(r.avatar)) p.avatar = r.avatar;
  if (r.lang === "en" || r.lang === "fr") p.lang = r.lang;
  if (typeof r.dailyLast === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.dailyLast)) p.dailyLast = r.dailyLast;
  if (Array.isArray(r.badges)) p.badges = BADGES.map((b) => b.id).filter((id) => (r.badges as unknown[]).includes(id));
  if (r.mastery && typeof r.mastery === "object") {
    for (const [code, level] of Object.entries(r.mastery)) {
      if (BY_CODE.has(code)) p.mastery[code] = Math.min(5, count(level));
    }
  }
  if (r.best && typeof r.best === "object") {
    for (const [key, score] of Object.entries(r.best)) {
      const [mode, scope, diff, extra, ...rest] = key.split("|");
      const valid =
        MODES.some((m) => m.id === mode) &&
        (SCOPES as readonly string[]).includes(scope) &&
        diff in DIFFICULTY &&
        (extra === undefined || extra === "survival") &&
        rest.length === 0;
      if (valid) p.best[key] = count(score);
    }
  }
  return p;
}

/**
 * Combines a restored save with this device's progress without losing anything:
 * the higher value of every counter, every badge, the best mastery per country.
 * Nickname and avatar come from the save on a brand-new device; otherwise they, the language
 * and sound settings stay as they are on this device.
 */
export function mergeProfiles(current: Profile, restored: Profile): Profile {
  const p: Profile = { ...current, mastery: { ...current.mastery }, best: { ...current.best } };
  if (current.gamesPlayed === 0) {
    p.name = restored.name;
    p.avatar = restored.avatar;
  }
  for (const k of COUNTERS) p[k] = Math.max(current[k], restored[k]);
  // The daily streak belongs to whichever save played most recently.
  if ((restored.dailyLast ?? "") > (current.dailyLast ?? "")) {
    p.dailyLast = restored.dailyLast;
    p.dailyStreak = restored.dailyStreak;
  } else if (restored.dailyLast !== current.dailyLast) {
    p.dailyStreak = current.dailyStreak;
  }
  p.badges = BADGES.map((b) => b.id).filter((id) => current.badges.includes(id) || restored.badges.includes(id));
  for (const [code, level] of Object.entries(restored.mastery)) p.mastery[code] = Math.max(p.mastery[code] ?? 0, level);
  for (const [key, score] of Object.entries(restored.best)) p.best[key] = Math.max(p.best[key] ?? 0, score);
  return p;
}
