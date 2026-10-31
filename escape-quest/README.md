# Escape Quest

A 3D escape room for kids in English, French and Portuguese. Players design a detective, walk through six rooms of Professor Marmalade's house, solve puzzles, and can play as a team.

This folder is its own static site, deployed as the separate Vercel project `escape-quest` (root directory: `escape-quest`). It is not part of the erikaslab website or Atlas Quest; it only lives in this repository.

- `index.html`: the whole game.
- `three.min.js`, `supabase.js`, `591.supabase.js`: vendored libraries (three.js 0.149.0, supabase-js 2.45.4).
- Team play uses Supabase Realtime presence on the atlas-quest Supabase project. Nothing is stored, and teams are joined by name only (no public list).
