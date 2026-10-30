// Generates the Atlas Quest app icon (public/icon.svg) with real continent shapes.
// Run with: node scripts/build-icon.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const land = feature(require("world-atlas/land-110m.json"), require("world-atlas/land-110m.json").objects.land);

const S = 512;
const C = 262; // globe center (slightly low, leaving room for the pin)
const R = 148;
// Tilted to show Europe, Africa and the Atlantic.
const projection = geoOrthographic().scale(R).translate([C, C]).rotate([-12, -22, 0]).clipAngle(90).precision(0.3);
const path = geoPath(projection);
const round = (d) => d.replace(/\d+\.\d+/g, (n) => (+n).toFixed(1));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="55%" stop-color="#3b1d8f"/>
      <stop offset="100%" stop-color="#0b0f2a"/>
    </radialGradient>
    <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="45%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
    <radialGradient id="shine" cx="35%" cy="28%" r="45%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
    <clipPath id="globe"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <g fill="#fff">
    <circle cx="96" cy="104" r="4" opacity="0.8"/><circle cx="420" cy="420" r="3" opacity="0.6"/>
    <circle cx="74" cy="380" r="3" opacity="0.5"/><circle cx="440" cy="92" r="2.5" opacity="0.7"/>
    <circle cx="150" cy="58" r="2" opacity="0.6"/>
  </g>
  <!-- orbit ring, back half -->
  <ellipse cx="${C}" cy="${C}" rx="206" ry="62" transform="rotate(-20 ${C} ${C})" fill="none" stroke="#fbbf24" stroke-width="10" stroke-opacity="0.45"/>
  <circle cx="${C}" cy="${C}" r="${R + 6}" fill="#0b0f2a" opacity="0.35"/>
  <circle cx="${C}" cy="${C}" r="${R}" fill="url(#ocean)"/>
  <g clip-path="url(#globe)">
    <path d="${round(path(geoGraticule10()))}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="1.5"/>
    <path d="${round(path(land))}" fill="url(#land)" stroke="#14532d" stroke-opacity="0.5" stroke-width="1.5"/>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#shine)"/>
    <circle cx="${C + 40}" cy="${C + 50}" r="${R + 30}" fill="none" stroke="#0b0f2a" stroke-opacity="0.25" stroke-width="70"/>
  </g>
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3"/>
  <!-- orbit ring, front half (only the lower arc passes in front of the globe) -->
  <g transform="rotate(-20 ${C} ${C})">
    <path d="M ${C - 206} ${C} A 206 62 0 0 0 ${C + 206} ${C}" fill="none" stroke="#fbbf24" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${C + 150}" cy="${C + 42}" r="13" fill="#fde047" stroke="#fff" stroke-width="4"/>
  </g>
  <!-- map pin -->
  <g transform="translate(330 66)">
    <ellipse cx="44" cy="150" rx="22" ry="7" fill="#0b0f2a" opacity="0.35"/>
    <path d="M44 0 C 80 0 100 26 100 56 C 100 92 62 118 44 146 C 26 118 -12 92 -12 56 C -12 26 8 0 44 0 Z" fill="url(#pin)" stroke="#fff" stroke-width="6"/>
    <circle cx="44" cy="54" r="20" fill="#fff"/>
    <path d="M44 40 l4.7 9.5 10.5 1.5 -7.6 7.4 1.8 10.4 -9.4 -4.9 -9.4 4.9 1.8 -10.4 -7.6 -7.4 10.5 -1.5 z" fill="#f97316"/>
  </g>
</svg>
`;

writeFileSync(new URL("../public/icon.svg", import.meta.url), svg);
console.log(`public/icon.svg written (${(svg.length / 1024).toFixed(1)} KB)`);
