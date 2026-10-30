import raw from "./countries.json";

export type Country = {
  code: string;
  mapId: string | null;
  name: string;
  nameFr: string;
  namePt: string;
  capital: string | null;
  capitalFr: string | null;
  capitalPt: string | null;
  /** Every name a player may type for this country (English, French, alternate spellings). */
  aliases: string[];
  region: string;
  subregion: string;
  area: number;
  latlng: [number, number];
  independent: boolean;
  landlocked: boolean;
};

export const COUNTRIES = raw as Country[];

/** Sovereign countries used for quizzes (territories still show up on the map). */
export const QUIZ_COUNTRIES = COUNTRIES.filter((c) => c.independent && c.capital);

export const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
export const BY_MAP_ID = new Map(
  COUNTRIES.filter((c) => c.mapId).map((c) => [c.mapId as string, c]),
);

export const SCOPES = ["World", "Africa", "Americas", "Asia", "Europe", "Oceania"] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_EMOJI: Record<Scope, string> = {
  World: "🌍",
  Africa: "🦁",
  Americas: "🗽",
  Asia: "🐉",
  Europe: "🏰",
  Oceania: "🏝️",
};

export function inScope(c: Country, scope: Scope) {
  return scope === "World" || c.region === scope;
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Search by country or capital, in any of the game's languages, ignoring accents. */
export function matchesSearch(c: Country, query: string) {
  const q = fold(query.trim());
  return !q || [c.name, c.nameFr, c.namePt, c.capital, c.capitalFr, c.capitalPt].some((s) => s && fold(s).includes(q));
}

export function flagUrl(code: string) {
  return `/flags/${code}.svg`;
}

/** Great-circle distance in km between two countries' center points. */
export function distanceKm(a: Country, b: Country) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latlng[0] - a.latlng[0]);
  const dLng = toRad(b.latlng[1] - a.latlng[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latlng[0])) * Math.cos(toRad(b.latlng[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
