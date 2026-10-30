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

// Initials let friends recognize each other in online rooms without typing a full name.
// Only 2–3 plain letters, minus combinations that are rude in English, French or Portuguese.
const BLOCKED_INITIALS = new Set([
  "ASS", "FUK", "FUC", "FCK", "SEX", "KKK", "NAZ", "FAG", "CUM", "TIT", "DIK", "DIC", "WTF", "STFU", "GAY", "XXX", "POO",
  "CUL", "CON", "PUT", "BIT", "FDP", "NTM", "TG", "VTF", "MRD", "PD",
  "PQP", "VSF", "CRL", "FDP", "BCT", "KCT", "PNC", "VTC", "VAI",
]);

export function normalizeInitials(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

export function isSafeInitials(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2,3}$/.test(value) && !BLOCKED_INITIALS.has(value);
}

/** A distinct color per player in a room, so two players with the same initials still look different. */
export const PLAYER_COLORS = ["#f472b6", "#60a5fa", "#facc15", "#34d399", "#fb923c", "#a78bfa", "#f87171", "#2dd4bf"];

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

// Portuguese: noun first, adjective agreeing in gender ("Raposa Veloz", "Lobo Esperto").
const NOUNS_PT: Record<string, [string, "m" | "f"]> = {
  Falcon: ["Falcão", "m"], Tiger: ["Tigre", "m"], Wolf: ["Lobo", "m"], Shark: ["Tubarão", "m"], Panda: ["Panda", "m"],
  Eagle: ["Águia", "f"], Fox: ["Raposa", "f"], Dragon: ["Dragão", "m"], Rhino: ["Rinoceronte", "m"], Cobra: ["Cobra", "f"],
  Lynx: ["Lince", "m"], Orca: ["Orca", "f"], Jaguar: ["Onça", "f"], Hawk: ["Gavião", "m"], Bear: ["Urso", "m"],
  Gecko: ["Lagartixa", "f"], Viking: ["Viking", "m"], Ninja: ["Ninja", "m"], Pilot: ["Piloto", "m"], Comet: ["Cometa", "m"],
};
const ADJECTIVES_PT: Record<string, [string, string]> = {
  Swift: ["Veloz", "Veloz"], Brave: ["Valente", "Valente"], Mighty: ["Poderoso", "Poderosa"], Clever: ["Esperto", "Esperta"],
  Turbo: ["Turbo", "Turbo"], Cosmic: ["Cósmico", "Cósmica"], Sneaky: ["Sorrateiro", "Sorrateira"], Epic: ["Épico", "Épica"],
  Rapid: ["Rápido", "Rápida"], Lucky: ["Sortudo", "Sortuda"], Fearless: ["Destemido", "Destemida"], Golden: ["Dourado", "Dourada"],
  Silent: ["Silencioso", "Silenciosa"], Stormy: ["Tempestuoso", "Tempestuosa"], Frosty: ["Gelado", "Gelada"], Blazing: ["Flamejante", "Flamejante"],
  Wild: ["Selvagem", "Selvagem"], Sharp: ["Afiado", "Afiada"], Hyper: ["Hiper", "Hiper"], Atomic: ["Atômico", "Atômica"],
};

export function displayNickname(name: string, lang: "en" | "fr" | "pt") {
  if (lang === "en") return name;
  const [a, b] = name.split(" ");
  const noun = (lang === "pt" ? NOUNS_PT : NOUNS_FR)[b];
  const adj = (lang === "pt" ? ADJECTIVES_PT : ADJECTIVES_FR)[a];
  if (!noun || !adj) return name;
  return `${noun[0]} ${adj[noun[1] === "m" ? 0 : 1]}`;
}
