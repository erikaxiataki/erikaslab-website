# Atlas Quest

A world geography game in **English, French and Portuguese** (EN/FR/PT switch in the header; French and Portuguese browsers start in their language).

- **Games:** Map Hunt (click the country), Flag Quiz, Flag Match, Capitals, or a Mix. Easy / Normal / Hard, for the whole world or one continent.
- **Modes:** Quick Play, Survival (lives), Daily Challenge, same-device Duel, "challenge a friend" links (same questions), and live **Online Rooms** with a private code.
- **Learning:** Explore (zoomable map with country facts) and flag Flashcards.
- **Rewards:** XP and levels, coins for hints, 20 badges, personal bests, and a "knowledge map" that colors in the countries you know.
- **Offline:** installable app (PWA). After the first visit, everything except online rooms works without internet.
- **Kid-safe online:** private rooms only, no chat (emoji reactions only), generated nicknames, nothing stored on a server.

The home page (`/`) always asks for a language (Français / English / Português), highlighting the last choice, then opens the game at `/atlas`.

Online rooms need a free Supabase project; see [SETUP-ONLINE.md](SETUP-ONLINE.md).

# Bible Quest

A separate game, hosted on the same site at **`/bible`**, that helps kids (8–16) learn the **66 books of the Bible** in order, in **English, French and Portuguese**. It has its own icon, install manifest, offline service worker (`public/bible-sw.js`, scoped to `/bible`), sounds and saved progress, and shares nothing with Atlas Quest.

- **Quest Map:** 8 islands, one per part of the Bible (Law, History, Poetry & Wisdom, Major and Minor Prophets, Gospels & Acts, Paul's Letters, Other Letters & Revelation). On each island you **meet** the books (cards and a chant), **practice** them, then beat the **boss shelf** to open the next island. The final challenge is the Great Library: all 66 books.
- **Games:** Bookshelf Builder (tap the books in order), Quick Quiz (What Comes Next?, What Came Before?, Missing Book, Which Book? from a story clue, Section Sorter, Old or New?), Type Them All, Survival and a Daily Challenge.
- **Learning:** every answer shows the right book with its neighbors and a one-line summary. Missed books come back more often (mastery 0–5 per book). Selah the owl gives hints.
- **Rewards:** XP and ranks, combos (x2, x3), coins for hints and streak shields, 18 badges, and the Great Library, a shelf that fills up as you master books.
- **Kid-safe:** no accounts, nothing leaves the device. Save codes move progress between devices.

Book data (names, chapters, summaries) lives in `src/lib/bible/books.ts`. The icon is drawn by `scripts/build-bible-icon.mjs`; run `node scripts/build-bible-icon.mjs` to regenerate the SVG and PNGs.

## Data

Country data, French and Portuguese names/capitals, and flags come from the `world-countries`, `world-atlas` and `flag-icons` packages. To regenerate them after updating those packages, run:

```bash
node scripts/build-atlas-data.mjs
```

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The service worker only registers in production builds (`npm run build && npm start`).
