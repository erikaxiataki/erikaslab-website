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
