import { SCOPES, type Scope } from "./countries";
import { type Difficulty, DIFFICULTY, MODES, type Mode } from "./game";
import { isSafeAvatar, isSafeNickname } from "./identity";

export type Challenge = {
  seed: number;
  mode: Mode;
  scope: Scope;
  difficulty: Difficulty;
  name: string;
  avatar: string;
  score: number;
};

export const CHALLENGE_LENGTH = 10;

function toBase64Url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
}

export function encodeChallenge(c: Challenge) {
  return toBase64Url(JSON.stringify([c.seed, c.mode, c.scope, c.difficulty, c.name, c.avatar, c.score]));
}

export function decodeChallenge(code: string): Challenge | null {
  try {
    const [seed, mode, scope, difficulty, name, avatar, score] = JSON.parse(fromBase64Url(code));
    if (
      !Number.isInteger(seed) ||
      !MODES.some((m) => m.id === mode) ||
      !SCOPES.includes(scope) ||
      !(difficulty in DIFFICULTY) ||
      !isSafeNickname(name) ||
      !isSafeAvatar(avatar) ||
      !Number.isFinite(score)
    )
      return null;
    return { seed, mode, scope, difficulty, name, avatar, score };
  } catch {
    return null;
  }
}

export function challengeUrl(c: Challenge) {
  return `${window.location.origin}/atlas?c=${encodeChallenge(c)}`;
}

/** Native share sheet on phones, clipboard elsewhere. Resolves to what happened. */
export async function shareLink(url: string, text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title: "Atlas Quest challenge", text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
