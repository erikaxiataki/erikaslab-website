# Turning on Atlas Quest online rooms

Everything in Atlas Quest works without this setup **except live Online Rooms**: solo games, survival, the daily challenge, duels, challenge links, explore, flashcards, and offline play. Online rooms need a free [Supabase](https://supabase.com) project to pass messages between players' devices.

**What gets stored:** nothing. Rooms use Supabase Realtime *Broadcast* and *Presence* only. No database tables are created, no accounts are made, and no chat is possible: players send nicknames, emoji avatars, scores and preset reactions. A room disappears when everyone leaves.

## 1. Create a free Supabase project (about 5 minutes)

1. Sign up at <https://supabase.com> and click **New project**. Any name and region works; pick the region closest to the players.
2. When the project is ready, open **Project Settings → API** (in newer dashboards: **Project Settings → API Keys**) and copy:
   - the **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - the **anon / publishable** key. This key is designed to be public. **Never** use the `service_role` / secret key.
3. Open **Realtime → Settings** and make sure public channels are allowed, i.e. the "private channels only" option is **off**. Recent dashboards may label this "Allow public access".

## 2. Add the keys to the website

In your hosting provider (e.g. Vercel: **Project → Settings → Environment Variables**), add:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |

Then **redeploy** the site. The keys are read at build time, so an old build won't see them.

For local development, put the same two lines in a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Check it works

Open `/atlas`. The **Online Room** tile should say **LIVE** instead of "Setup needed". Create a room on one device, join with the code on another, and play.

## Safety notes

- Private rooms only: you can only join with the 5-character code. There's no lobby list or matchmaking with strangers.
- No typed text: nicknames come from a fixed generator ("Swift Falcon"), and reactions are a fixed emoji set. Anything else received over the network is ignored.
- Rooms hold up to 8 players.
