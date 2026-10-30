// Generates the Bible Quest app icon: public/bible/icon.svg and src/app/bible/icon.svg, plus the PNG sizes
// (public/bible/icon-192.png, icon-512.png and src/app/bible/apple-icon.png) when Playwright is available.
// Run with: node scripts/build-bible-icon.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const S = 512;
// Four-point sparkle centered at (x, y) with radius r.
const sparkle = (x, y, r, fill) =>
  `<path d="M${x} ${y - r} C ${x + r * 0.14} ${y - r * 0.14} ${x + r * 0.14} ${y - r * 0.14} ${x + r} ${y} C ${x + r * 0.14} ${y + r * 0.14} ${x + r * 0.14} ${y + r * 0.14} ${x} ${y + r} C ${x - r * 0.14} ${y + r * 0.14} ${x - r * 0.14} ${y + r * 0.14} ${x - r} ${y} C ${x - r * 0.14} ${y - r * 0.14} ${x - r * 0.14} ${y - r * 0.14} ${x} ${y - r} Z" fill="${fill}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="35%" stop-color="#ea580c"/>
      <stop offset="75%" stop-color="#7c2d12"/>
      <stop offset="100%" stop-color="#2a1206"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#fde68a" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pageL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="80%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#e7c98a"/>
    </linearGradient>
    <linearGradient id="pageR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="80%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#e7c98a"/>
    </linearGradient>
    <linearGradient id="cover" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
    <radialGradient id="fade" cx="50%" cy="50%" r="50%">
      <stop offset="30%" stop-color="#fff"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <mask id="rays"><circle cx="256" cy="250" r="240" fill="url(#fade)"/></mask>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <!-- Artwork kept inside the central safe zone, so round "maskable" icons don't crop it. -->
  <g transform="translate(256 262) scale(0.86) translate(-256 -262)">

  <!-- light rising from the open book -->
  <g opacity="0.55" fill="#fff7d6" mask="url(#rays)">
    <path d="M256 250 L176 40 L214 36 Z"/><path d="M256 250 L298 36 L336 40 Z"/>
    <path d="M256 250 L96 92 L124 70 Z"/><path d="M256 250 L388 70 L416 92 Z"/>
    <path d="M256 250 L242 20 L270 20 Z"/>
  </g>
  <circle cx="256" cy="200" r="150" fill="url(#glow)"/>

  <!-- the goal: a golden star above the book -->
  <circle cx="256" cy="118" r="46" fill="#fffbeb" opacity="0.35"/>
  ${sparkle(256, 118, 78, "url(#gold)")}
  ${sparkle(256, 118, 32, "#fffbeb")}
  ${sparkle(132, 150, 16, "#fffbeb")}
  ${sparkle(384, 158, 12, "#fffbeb")}
  ${sparkle(410, 108, 7, "#fffbeb")}

  <!-- the book -->
  <ellipse cx="256" cy="440" rx="190" ry="22" fill="#1c0a03" opacity="0.35"/>
  <path d="M256 246 C 205 214, 128 208, 70 224 L 70 414 C 128 398, 205 402, 256 432 C 307 402, 384 398, 442 414 L 442 224 C 384 208, 307 214, 256 246 Z" fill="url(#cover)"/>
  <path d="M256 236 C 207 206, 134 200, 82 214 L 82 400 C 134 386, 207 390, 256 420 C 305 390, 378 386, 430 400 L 430 214 C 378 200, 305 206, 256 236 Z" fill="#f5e1b0"/>
  <path d="M256 226 C 209 196, 140 190, 92 203 L 92 388 C 140 374, 209 378, 256 408 Z" fill="url(#pageL)"/>
  <path d="M256 226 C 303 196, 372 190, 420 203 L 420 388 C 372 374, 303 378, 256 408 Z" fill="url(#pageR)"/>
  <path d="M256 226 L256 408" stroke="#c99a4b" stroke-width="4"/>

  <!-- the quest trail across the pages, ending at an X -->
  <path d="M120 362 C 150 352, 160 316, 196 318 S 236 350, 262 330 S 296 270, 330 280 S 372 262, 384 248"
        fill="none" stroke="#b45309" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 18"/>
  <circle cx="120" cy="362" r="9" fill="#b45309"/>
  <g stroke="#dc2626" stroke-width="10" stroke-linecap="round">
    <path d="M374 222 L398 246"/><path d="M398 222 L374 246"/>
  </g>
  </g>
</svg>
`;

const out = (p) => new URL(`../${p}`, import.meta.url);
// One copy for the install manifest, one for the browser tab of the /bible pages.
for (const file of ["public/bible/icon.svg", "src/app/bible/icon.svg"]) {
  writeFileSync(out(file), svg);
  console.log(`${file} written (${(svg.length / 1024).toFixed(1)} KB)`);
}

// PNGs for phones and the install manifest.
let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  console.log("Playwright not found: PNGs not updated.");
  process.exit(0);
}
const browser = await chromium.launch();
for (const [size, file] of [
  [192, "public/bible/icon-192.png"],
  [512, "public/bible/icon-512.png"],
  [180, "src/app/bible/apple-icon.png"],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${size}" height="${size}">`);
  await page.screenshot({ path: out(file).pathname });
  console.log(`${file} written`);
}
await browser.close();
