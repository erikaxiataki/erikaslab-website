# Escape Quest

A 3D escape room for kids in English, French and Portuguese. Players design a detective, walk through 19 rooms in four worlds (Marmalade's House, the Animal Sports Camp, the Jungle Rescue and the Ocean Adventure), solve puzzles, and can play as a team.

This folder is its own static site, deployed as the separate Vercel project `escape-quest` (root directory: `escape-quest`). It is not part of the erikaslab website or Atlas Quest; it only lives in this repository.

- Two detective levels: Junior (ages 6 to 10) and Expert (11 and up, with harder math, decimals and longer memory puzzles).
- After each room, a scrolling adventure map (winding road, round level buttons, the detective walking to the next level) shows the stars earned (escape, few hints, golden fish), a "Did you know?" fact, the skills practiced and a movement break. Stars unlock prizes (dance moves, pets, a crown) and are saved on the device.
- Each room has its own music; puzzle moments vibrate on phones that allow it.

- `index.html`: the whole game.
- `three.min.js`, `supabase.js`, `591.supabase.js`: vendored libraries (three.js 0.149.0, supabase-js 2.45.4).
- Team play uses Supabase Realtime presence on the atlas-quest Supabase project. Nothing is stored, and teams are joined by name only (no public list).
