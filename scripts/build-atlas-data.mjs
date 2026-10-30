// Generates compact country data + flag assets for the Atlas Quest game.
// Run with: node scripts/build-atlas-data.mjs
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const countries = require("world-countries");
const topo = require("world-atlas/countries-50m.json");

// Fixes to the dataset: outdated names and capitals that schools don't usually teach.
const NAMES_FR = { sz: "Eswatini", ax: "Îles Åland" };
const CAPITAL_FIX = { sz: "Mbabane" }; // Lobamba is the royal/legislative seat; Mbabane is the one taught

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
  xk: "Pristina", tl: "Dili", fm: "Palikir", ws: "Apia", to: "Nukuʻalofa", ki: "Tarawa-Sud",
  ci: "Yamoussoukro", za: "Pretoria", cd: "Kinshasa", cg: "Brazzaville", tz: "Dodoma",
  hk: "Victoria", pf: "Papeete", eh: "Laâyoune", gs: "King Edward Point", tf: "Port-aux-Français",
};

// Brazilian Portuguese names where the dataset uses Portugal's spelling (both are accepted when typing).
const NAMES_PT = {
  am: "Armênia", az: "Azerbaijão", bw: "Botsuana", by: "Bielorrússia", cz: "Tchéquia", dj: "Djibuti", ee: "Estônia",
  ir: "Irã", ke: "Quênia", lv: "Letônia", mc: "Mônaco", mg: "Madagascar", mk: "Macedônia do Norte", nl: "Países Baixos",
  pe: "Peru", pg: "Papua-Nova Guiné", pl: "Polônia", ro: "Romênia", si: "Eslovênia", sz: "Essuatíni", sc: "Seychelles",
  tt: "Trinidad e Tobago", vc: "São Vicente e Granadinas", vn: "Vietnã", ye: "Iêmen", zw: "Zimbábue", va: "Vaticano",
  gl: "Groenlândia", ps: "Palestina",
};

// Capitals in Portuguese where they differ from English.
const CAPITALS_PT = {
  af: "Cabul", dz: "Argel", am: "Erevã", at: "Viena", bd: "Daca", be: "Bruxelas", bg: "Sófia", cn: "Pequim",
  cu: "Havana", cy: "Nicósia", cz: "Praga", dk: "Copenhague", eg: "Cairo", et: "Adis Abeba", fi: "Helsinque",
  de: "Berlim", gr: "Atenas", gt: "Cidade da Guatemala", in: "Nova Délhi", id: "Jacarta", ir: "Teerã", iq: "Bagdá",
  il: "Jerusalém", it: "Roma", jo: "Amã", kw: "Cidade do Kuwait", la: "Vienciana", lb: "Beirute", ly: "Trípoli",
  lu: "Luxemburgo", mt: "Valeta", mx: "Cidade do México", mc: "Mônaco", mn: "Ulan Bator", np: "Katmandu",
  mk: "Escópia", om: "Mascate", pa: "Cidade do Panamá", py: "Assunção", pl: "Varsóvia", pt: "Lisboa",
  ro: "Bucareste", ru: "Moscou", sa: "Riad", rs: "Belgrado", sg: "Singapura", si: "Liubliana", so: "Mogadíscio",
  za: "Pretória", kr: "Seul", es: "Madri", sd: "Cartum", se: "Estocolmo", ch: "Berna", sy: "Damasco", tw: "Taipé",
  tj: "Duchambé", tn: "Túnis", tr: "Ancara", tm: "Asgabate", ua: "Kiev", gb: "Londres", us: "Washington",
  uz: "Tashkent", va: "Vaticano", vn: "Hanói", ye: "Sanaa", ws: "Ápia", tt: "Porto de Espanha", ht: "Porto Príncipe",
  ni: "Manágua", uy: "Montevidéu", bf: "Uagadugu", cm: "Iaundé", dj: "Djibuti", gh: "Acra", gn: "Conacri",
  ke: "Nairóbi", lr: "Monróvia", sn: "Dacar", au: "Camberra", ki: "Tarawa do Sul", to: "Nucualofa",
  is: "Reiquiavique", hu: "Budapeste", ad: "Andorra-a-Velha", nl: "Amsterdã", sm: "São Marinho", jp: "Tóquio",
  tl: "Díli", ag: "Saint John's", gd: "Saint George's", kh: "Phnom Penh", td: "N'Djamena", mv: "Malé",
  md: "Chișinău", kp: "Pyongyang", st: "São Tomé", eh: "El Aiune", hk: "Vitória", pf: "Papeete",
};

// Extra names kids are likely to type, on top of the dataset's alternate spellings.
const EXTRA_NAMES = {
  us: ["US", "America", "United States of America", "Etats-Unis", "Amerique"],
  gb: ["UK", "Britain", "England", "Angleterre", "Grande-Bretagne"],
  cd: ["Congo Kinshasa", "Democratic Republic of Congo", "RDC", "RD Congo"],
  cg: ["Congo Brazzaville"],
  es: ["Espana"],
  nl: ["Holland", "Hollande", "Holanda"],
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
    c.translations.por?.common,
    c.translations.por?.official,
    NAMES_PT[c.cca2.toLowerCase()],
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
    const code = c.cca2.toLowerCase();
    const capital = CAPITAL_FIX[code] ?? c.capital?.[0] ?? null;
    const mapId = c.cca2 === "XK" ? "XK" : c.ccn3;
    return {
      code: c.cca2.toLowerCase(),
      mapId: shapeIds.has(mapId) ? mapId : null,
      name: c.name.common,
      nameFr: NAMES_FR[code] ?? c.translations.fra?.common ?? c.name.common,
      namePt: NAMES_PT[c.cca2.toLowerCase()] ?? c.translations.por?.common ?? c.name.common,
      capital,
      capitalFr: CAPITALS_FR[code] ?? capital,
      capitalPt: CAPITALS_PT[code] ?? capital,
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
