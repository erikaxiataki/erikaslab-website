// Generates compact country data + flag assets for the Atlas Quest game.
// Run with: node scripts/build-atlas-data.mjs
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const countries = require("world-countries");
const topo = require("world-atlas/countries-50m.json");

// French names for capitals that differ from English (everything else is spelled the same).
const CAPITALS_FR = {
  af: "Kaboul", dz: "Alger", ag: "Saint John's", am: "Erevan", at: "Vienne", az: "Bakou", bh: "Manama",
  bd: "Dacca", be: "Bruxelles", bt: "Thimphou", bn: "Bandar Seri Begawan", bg: "Sofia", kh: "Phnom Penh",
  cv: "Praia", td: "N'Djaména", cn: "Pékin", co: "Bogota", km: "Moroni", cr: "San José", cu: "La Havane",
  cy: "Nicosie", cz: "Prague", dk: "Copenhague", eg: "Le Caire", er: "Asmara", ee: "Tallinn",
  et: "Addis-Abeba", fi: "Helsinki", ge: "Tbilissi", gr: "Athènes", gd: "Saint-Georges",
  gt: "Guatemala", hn: "Tegucigalpa", is: "Reykjavik", in: "New Delhi", id: "Jakarta", ir: "Téhéran",
  iq: "Bagdad", il: "Jérusalem", jo: "Amman", kz: "Astana", kw: "Koweït", kg: "Bichkek", lb: "Beyrouth",
  ly: "Tripoli", lt: "Vilnius", mg: "Antananarivo", mv: "Malé", mt: "La Valette", mu: "Port-Louis",
  mx: "Mexico", md: "Chișinău", mn: "Oulan-Bator", mz: "Maputo", mm: "Naypyidaw", np: "Katmandou",
  kp: "Pyongyang", mk: "Skopje", om: "Mascate", pa: "Panama", py: "Asuncion", pl: "Varsovie",
  pt: "Lisbonne", ro: "Bucarest", ru: "Moscou", kn: "Basseterre", lc: "Castries", vc: "Kingstown",
  sm: "Saint-Marin", st: "São Tomé", sa: "Riyad", rs: "Belgrade", sg: "Singapour", sk: "Bratislava",
  si: "Ljubljana", so: "Mogadiscio", kr: "Séoul", ss: "Djouba", es: "Madrid", sd: "Khartoum",
  se: "Stockholm", ch: "Berne", sy: "Damas", tw: "Taipei", tj: "Douchanbé", th: "Bangkok",
  tt: "Port-d'Espagne", tn: "Tunis", tm: "Achgabat", ua: "Kiev", ae: "Abou Dabi", gb: "Londres",
  us: "Washington", uz: "Tachkent", va: "Vatican", vn: "Hanoï", ye: "Sanaa", ps: "Ramallah",
  xk: "Pristina", sz: "Lobamba", tl: "Dili", fm: "Palikir", ws: "Apia", to: "Nukuʻalofa", ki: "Tarawa-Sud",
  ci: "Yamoussoukro", za: "Pretoria", cd: "Kinshasa", cg: "Brazzaville", tz: "Dodoma",
  hk: "Victoria", pf: "Papeete", eh: "Laâyoune", gs: "King Edward Point", tf: "Port-aux-Français",
};

// Extra names kids are likely to type, on top of the dataset's alternate spellings.
const EXTRA_NAMES = {
  us: ["US", "America", "United States of America", "Etats-Unis", "Amerique"],
  gb: ["UK", "Britain", "England", "Angleterre", "Grande-Bretagne"],
  cd: ["Congo Kinshasa", "Democratic Republic of Congo", "RDC", "RD Congo"],
  cg: ["Congo Brazzaville"],
  es: ["Espana"],
  cz: ["Czech Republic", "Republique tcheque"],
  cv: ["Cabo Verde"],
  tl: ["East Timor", "Timor oriental"],
  mm: ["Birmanie"],
  ae: ["UAE", "Emirates", "Emirats arabes unis", "EAU"],
  ci: ["Ivory Coast"],
  va: ["Vatican"],
  kr: ["Korea"],
  ba: ["Bosnia"],
  cf: ["CAR"],
  nl: ["Holland", "Hollande"],
  mk: ["Macedonia", "Macedoine"],
  sz: ["Swaziland"],
  tr: ["Turkey", "Turkiye"],
  ru: ["Russian Federation"],
};

// Names players can type to answer: English and French names plus alternate spellings
// (Latin script only, no 2-letter codes, no "Korea, Republic of"-style reorderings).
function aliasesFor(c) {
  const all = [
    c.name.common,
    c.name.official,
    c.translations.fra?.common,
    c.translations.fra?.official,
    ...c.altSpellings,
  ];
  const fromData = all.filter((n) => n && n.length >= 3 && !n.includes(",") && /^[\p{Script=Latin}\s'’.()-]+$/u.test(n));
  return [...new Set([...fromData, ...(EXTRA_NAMES[c.cca2.toLowerCase()] ?? [])])];
}

const root = new URL("..", import.meta.url).pathname;
const shapeIds = new Set(
  topo.objects.countries.geometries.map((g) => g.id ?? (g.properties.name === "Kosovo" ? "XK" : undefined)).filter(Boolean),
);

const out = countries
  .filter((c) => c.cca2 !== "AQ")
  .map((c) => {
    const mapId = c.cca2 === "XK" ? "XK" : c.ccn3;
    return {
      code: c.cca2.toLowerCase(),
      mapId: shapeIds.has(mapId) ? mapId : null,
      name: c.name.common,
      nameFr: c.translations.fra?.common ?? c.name.common,
      capital: c.capital?.[0] ?? null,
      capitalFr: CAPITALS_FR[c.cca2.toLowerCase()] ?? c.capital?.[0] ?? null,
      region: c.region,
      subregion: c.subregion || c.region,
      aliases: aliasesFor(c),
      area: Math.round(c.area),
      latlng: c.latlng,
      independent: Boolean(c.independent) || c.cca2 === "XK",
      landlocked: c.landlocked,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(join(root, "src/lib/atlas/countries.json"), JSON.stringify(out));

const flagDir = join(root, "public/flags");
mkdirSync(flagDir, { recursive: true });
for (const c of out) {
  copyFileSync(require.resolve(`flag-icons/flags/4x3/${c.code}.svg`), join(flagDir, `${c.code}.svg`));
}
writeFileSync(join(root, "public/flags/list.json"), JSON.stringify(out.map((c) => c.code)));
console.log(`${out.length} countries, ${out.filter((c) => c.independent).length} independent, ${out.filter((c) => c.mapId).length} on map`);
