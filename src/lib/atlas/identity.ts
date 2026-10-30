// Kid-safe identity: no typed names, just generated nicknames + animal avatars.

const ADJECTIVES = [
  "Swift", "Brave", "Mighty", "Clever", "Turbo", "Cosmic", "Sneaky", "Epic", "Rapid", "Lucky",
  "Fearless", "Golden", "Silent", "Stormy", "Frosty", "Blazing", "Wild", "Sharp", "Hyper", "Atomic",
];
const NOUNS = [
  "Falcon", "Tiger", "Wolf", "Shark", "Panda", "Eagle", "Fox", "Dragon", "Rhino", "Cobra",
  "Lynx", "Orca", "Jaguar", "Hawk", "Bear", "Gecko", "Viking", "Ninja", "Pilot", "Comet",
];

export const AVATARS = ["🦊", "🐺", "🦁", "🐯", "🐼", "🦅", "🦈", "🐉", "🦖", "🐙", "🦉", "🐧", "🦄", "🐸", "🦍", "🐲"];

export function randomNickname() {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

/** Only accept nicknames our generator could have produced (used for anything received over the network). */
export function isSafeNickname(name: unknown): name is string {
  if (typeof name !== "string") return false;
  const [a, b, ...rest] = name.split(" ");
  return rest.length === 0 && ADJECTIVES.includes(a) && NOUNS.includes(b);
}

export function isSafeAvatar(avatar: unknown): avatar is string {
  return typeof avatar === "string" && AVATARS.includes(avatar);
}

// French display versions of the generated nicknames (the English form is what gets stored and sent).
const NOUNS_FR: Record<string, [string, "m" | "f"]> = {
  Falcon: ["Faucon", "m"], Tiger: ["Tigre", "m"], Wolf: ["Loup", "m"], Shark: ["Requin", "m"], Panda: ["Panda", "m"],
  Eagle: ["Aigle", "m"], Fox: ["Renard", "m"], Dragon: ["Dragon", "m"], Rhino: ["Rhino", "m"], Cobra: ["Cobra", "m"],
  Lynx: ["Lynx", "m"], Orca: ["Orque", "f"], Jaguar: ["Jaguar", "m"], Hawk: ["Épervier", "m"], Bear: ["Ours", "m"],
  Gecko: ["Gecko", "m"], Viking: ["Viking", "m"], Ninja: ["Ninja", "m"], Pilot: ["Pilote", "m"], Comet: ["Comète", "f"],
};
const ADJECTIVES_FR: Record<string, [string, string]> = {
  Swift: ["Rapide", "Rapide"], Brave: ["Brave", "Brave"], Mighty: ["Puissant", "Puissante"], Clever: ["Malin", "Maligne"],
  Turbo: ["Turbo", "Turbo"], Cosmic: ["Cosmique", "Cosmique"], Sneaky: ["Sournois", "Sournoise"], Epic: ["Épique", "Épique"],
  Rapid: ["Véloce", "Véloce"], Lucky: ["Chanceux", "Chanceuse"], Fearless: ["Intrépide", "Intrépide"], Golden: ["Doré", "Dorée"],
  Silent: ["Silencieux", "Silencieuse"], Stormy: ["Orageux", "Orageuse"], Frosty: ["Givré", "Givrée"], Blazing: ["Ardent", "Ardente"],
  Wild: ["Sauvage", "Sauvage"], Sharp: ["Futé", "Futée"], Hyper: ["Hyper", "Hyper"], Atomic: ["Atomique", "Atomique"],
};

export function displayNickname(name: string, lang: "en" | "fr") {
  if (lang === "en") return name;
  const [a, b] = name.split(" ");
  const noun = NOUNS_FR[b];
  const adj = ADJECTIVES_FR[a];
  if (!noun || !adj) return name;
  return `${noun[0]} ${adj[noun[1] === "m" ? 0 : 1]}`;
}
