"use client";

import { Download, Volume2, VolumeX, WifiOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Duel } from "@/components/atlas/Duel";
import { Explore } from "@/components/atlas/Explore";
import { Flashcards } from "@/components/atlas/Flashcards";
import { NameAll } from "@/components/atlas/NameAll";
import { OnlineRoom } from "@/components/atlas/OnlineRoom";
import { ProfileScreen } from "@/components/atlas/ProfileScreen";
import { ResultScreen } from "@/components/atlas/ResultScreen";
import { type Settings, SettingsPicker } from "@/components/atlas/SettingsPicker";
import { type SoloConfig, SoloGame } from "@/components/atlas/SoloGame";
import { GameButton, Panel, ProgressBar, SectionTitle } from "@/components/atlas/ui";
import { CHALLENGE_LENGTH, type Challenge, decodeChallenge } from "@/lib/atlas/challenge";
import { SCOPE_EMOJI } from "@/lib/atlas/countries";
import { DIFFICULTY, MODES, dailySeed, randomSeed } from "@/lib/atlas/game";
import { LANGS, useI18n } from "@/lib/atlas/i18n";
import { onlineEnabled } from "@/lib/atlas/online";
import { type Rewards, type RoundResult, applyRound, bestKey, levelFromXp, rankFor } from "@/lib/atlas/progress";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";

type Screen =
  | { name: "home" }
  | { name: "setup"; survival: boolean }
  | { name: "solo"; config: SoloConfig; challenge?: Challenge | null; label?: string }
  | { name: "result"; result: RoundResult; rewards: Rewards; config: SoloConfig; challenge?: Challenge | null; label?: string }
  | { name: "challenge"; challenge: Challenge }
  | { name: "online"; code?: string | null }
  | { name: "duel" }
  | { name: "explore" }
  | { name: "cards" }
  | { name: "nameall" }
  | { name: "profile" };

type InstallPrompt = Event & { prompt: () => Promise<void> };

function dailyConfig(): SoloConfig {
  return { mode: "mix", scope: "World", difficulty: "normal", seed: dailySeed(), count: 10, daily: true };
}

function challengeConfig(c: Challenge): SoloConfig {
  return { mode: c.mode, scope: c.scope, difficulty: c.difficulty, seed: c.seed, count: CHALLENGE_LENGTH };
}

export function AtlasGame() {
  const params = useSearchParams();
  const profile = useProfile();
  const { t, lang, nick, num } = useI18n();
  const [screen, setScreen] = useState<Screen>(() => {
    const c = params.get("c");
    const challenge = c ? decodeChallenge(c) : null;
    if (challenge) return { name: "challenge", challenge };
    const room = params.get("room");
    if (room) return { name: "online", code: room };
    return { name: "home" };
  });
  const [settings, setSettings] = useState<Settings>({ mode: "map", scope: "World", difficulty: "easy" });
  const [offlineReady, setOfflineReady] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);

  // Offline support: the service worker caches the game after the first visit.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then(() => setOfflineReady(true))
      .catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const go = useCallback((s: Screen) => {
    play("click");
    setScreen(s);
    window.scrollTo({ top: 0 });
    if (window.location.search) window.history.replaceState(null, "", "/atlas");
  }, []);

  const finish = (config: SoloConfig, challenge: Challenge | null | undefined, label: string | undefined) => (result: RoundResult) => {
    if (!profile) return;
    const won = challenge && result.score > challenge.score ? 1 : 0;
    const out = applyRound(profile, result, { challengesWon: won }, config.survival);
    setProfile(out.profile);
    play(out.rewards.leveledUp ? "levelup" : "win");
    setScreen({ name: "result", result, rewards: out.rewards, config, challenge, label });
    window.scrollTo({ top: 0 });
  };

  if (!profile) {
    return <div className="grid min-h-[60vh] place-items-center text-slate-400">🌍</div>;
  }

  const { level, into, need } = levelFromXp(profile.xp);
  const rank = rankFor(level);
  const today = new Date().toISOString().slice(0, 10);

  let body: React.ReactNode;
  switch (screen.name) {
    case "home":
      body = <Home onGo={go} dailyDone={profile.dailyLast === today} dailyStreak={profile.dailyStreak} />;
      break;
    case "setup": {
      const best = profile.best[bestKey(settings.mode, settings.scope, settings.difficulty, screen.survival)];
      body = (
        <Panel className="flex flex-col gap-4">
          <SectionTitle>{screen.survival ? `💀 ${t("Survival")}` : `⚡ ${t("Quick Play")}`}</SectionTitle>
          <p className="text-slate-300">
            {screen.survival
              ? t("Keep going until you run out of lives ({n} ❤️ on {level}). How far can you get?", {
                  n: DIFFICULTY[settings.difficulty].lives,
                  level: t(DIFFICULTY[settings.difficulty].label),
                })
              : t("10 questions. Answer fast for bonus points and build a streak for x2 and x3!")}
          </p>
          <SettingsPicker value={settings} onChange={setSettings} />
          <div className="flex flex-wrap items-center gap-3">
            <GameButton
              tone="go"
              className="text-lg"
              onClick={() => go({ name: "solo", config: { ...settings, seed: randomSeed(), count: 10, survival: screen.survival, fresh: true } })}
            >
              {t("▶ Play!")}
            </GameButton>
            {best ? <span className="text-sm text-amber-300">{t("⭐ Your best here: {n}", { n: best })}</span> : null}
          </div>
        </Panel>
      );
      break;
    }
    case "solo":
      body = (
        <SoloGame
          key={screen.config.seed}
          config={screen.config}
          label={screen.label}
          onQuit={() => go({ name: "home" })}
          onFinish={finish(screen.config, screen.challenge, screen.label)}
        />
      );
      break;
    case "result": {
      const { config, challenge, label } = screen;
      body = (
        <ResultScreen
          result={screen.result}
          rewards={screen.rewards}
          seed={config.seed}
          challenge={challenge}
          survival={config.survival}
          onHome={() => go({ name: "home" })}
          onAgain={() =>
            go({
              name: "solo",
              // Daily and challenge replays keep the same questions; everything else gets fresh ones.
              config: config.daily || challenge ? { ...config } : { ...config, seed: randomSeed() },
              challenge,
              label,
            })
          }
        />
      );
      break;
    }
    case "challenge": {
      const c = screen.challenge;
      const mode = MODES.find((m) => m.id === c.mode);
      body = (
        <Panel className="atlas-pop flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-6xl">{c.avatar}</span>
          <p className="text-2xl font-black text-white">{t("{name} challenges you!", { name: nick(c.name) })}</p>
          <p className="text-slate-300">
            {mode?.emoji} {mode && t(mode.label)} · {SCOPE_EMOJI[c.scope]} {t(c.scope)} · {DIFFICULTY[c.difficulty].emoji} {t(DIFFICULTY[c.difficulty].label)}
          </p>
          <p className="text-4xl font-black text-amber-300">{t("{n} pts", { n: c.score })}</p>
          <p className="text-sm text-slate-400">{t("Same {n} questions. Can you beat it?", { n: CHALLENGE_LENGTH })}</p>
          <GameButton
            tone="go"
            className="text-lg"
            onClick={() => go({ name: "solo", config: challengeConfig(c), challenge: c, label: `🎯 vs ${nick(c.name)}` })}
          >
            {t("🎯 Accept challenge")}
          </GameButton>
          <GameButton tone="ghost" onClick={() => go({ name: "home" })}>
            {t("Not now")}
          </GameButton>
        </Panel>
      );
      break;
    }
    case "online":
      body = <OnlineRoom initialCode={screen.code} onHome={() => go({ name: "home" })} />;
      break;
    case "duel":
      body = <Duel onHome={() => go({ name: "home" })} />;
      break;
    case "explore":
      body = <Explore />;
      break;
    case "cards":
      body = <Flashcards />;
      break;
    case "nameall":
      body = <NameAll onHome={() => go({ name: "home" })} />;
      break;
    case "profile":
      body = <ProfileScreen />;
      break;
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#070b18]/90 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-b-2xl">
        <button type="button" onClick={() => go({ name: "home" })} className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/icon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
          <span>
            Atlas<span className="text-violet-400">Quest</span>
          </span>
        </button>
        <button type="button" onClick={() => go({ name: "profile" })} className="ml-auto flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-800">
          <span className="text-2xl">{profile.avatar}</span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-tight font-bold text-white">{nick(profile.name)}</span>
            <span className="block text-xs leading-tight text-violet-300">
              {rank.emoji} {t(rank.title)}
            </span>
          </span>
          <span className="flex flex-col items-start">
            <span className="text-xs font-black text-white">{t("Lv {n}", { n: level })}</span>
            <ProgressBar value={into / need} className="h-1.5 w-14" />
          </span>
        </button>
        <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-bold text-amber-200 tabular-nums">🪙 {num(profile.coins)}</span>
        <div role="group" aria-label="Language / Langue / Idioma" className="flex overflow-hidden rounded-lg text-xs font-black ring-1 ring-white/15">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              lang={l.id}
              title={l.label}
              aria-pressed={lang === l.id}
              onClick={() => setProfile((p) => ({ ...p, lang: l.id }))}
              className={cn("px-1.5 py-1", lang === l.id ? "bg-violet-500 text-white" : "text-slate-400 hover:text-white")}
            >
              {l.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={profile.muted ? t("Unmute sounds") : t("Mute sounds")}
          onClick={() => setProfile((p) => ({ ...p, muted: !p.muted }))}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
        >
          {profile.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        {install ? (
          <button
            type="button"
            onClick={() => install.prompt().finally(() => setInstall(null))}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-500/20 px-2 py-1 text-xs font-bold text-violet-200 hover:bg-violet-500/30"
          >
            <Download className="size-4" /> {t("Install")}
          </button>
        ) : (
          offlineReady && (
            <span title={t("This game works offline")} className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <WifiOff className="size-3.5" /> <span className="hidden sm:inline">{t("Offline ready")}</span>
            </span>
          )
        )}
      </header>
      {screen.name !== "home" && screen.name !== "solo" && (
        <button type="button" onClick={() => go({ name: "home" })} className="self-start text-sm font-semibold text-slate-400 hover:text-white">
          ← {t("Menu")}
        </button>
      )}
      {body}
    </div>
  );
}

function Home({ onGo, dailyDone, dailyStreak }: { onGo: (s: Screen) => void; dailyDone: boolean; dailyStreak: number }) {
  const { t } = useI18n();
  const tiles: { emoji: string; title: string; text: string; screen: Screen; className: string; badge?: string }[] = [
    {
      emoji: "📅",
      title: "Daily Challenge",
      text: dailyDone ? "Done today! Come back tomorrow, or replay for fun." : "10 new questions every day. Same for everyone!",
      screen: { name: "solo", config: dailyConfig(), label: "📅 Daily" },
      className: "from-amber-500/30 to-orange-600/20 ring-amber-400/40 sm:col-span-2",
      badge: dailyStreak ? t("🔥 {n}-day streak", { n: dailyStreak }) : t("+25 🪙 bonus"),
    },
    { emoji: "⚡", title: "Quick Play", text: "Map Hunt, Flags, Capitals, Name It or a Mix. 10 questions.", screen: { name: "setup", survival: false }, className: "from-violet-500/30 to-indigo-600/20 ring-violet-400/40" },
    {
      emoji: "⌨️",
      title: "Name Them All",
      text: "How many countries can you type before the timer runs out?",
      screen: { name: "nameall" },
      className: "from-teal-500/30 to-cyan-700/20 ring-teal-400/40",
    },
    { emoji: "💀", title: "Survival", text: "Endless questions. Lose your lives and it's over.", screen: { name: "setup", survival: true }, className: "from-rose-500/30 to-red-700/20 ring-rose-400/40" },
    {
      emoji: "🌐",
      title: "Online Room",
      text: "Play live with friends at their homes. Private room code.",
      screen: { name: "online" },
      className: "from-sky-500/30 to-cyan-600/20 ring-sky-400/40",
      badge: onlineEnabled ? t("LIVE") : t("Setup needed"),
    },
    { emoji: "⚔️", title: "Duel", text: "2 players, 1 device. Take turns. Who knows more?", screen: { name: "duel" }, className: "from-fuchsia-500/30 to-pink-600/20 ring-fuchsia-400/40" },
    { emoji: "🔭", title: "Explore", text: "Zoom around the world map and discover countries.", screen: { name: "explore" }, className: "from-emerald-500/30 to-teal-600/20 ring-emerald-400/40" },
    { emoji: "🃏", title: "Flashcards", text: "Flip flags to learn names and capitals.", screen: { name: "cards" }, className: "from-lime-500/25 to-green-700/20 ring-lime-400/40" },
    { emoji: "🏅", title: "Badges & Stats", text: "Your level, badges, records and knowledge map.", screen: { name: "profile" }, className: "from-slate-500/30 to-slate-700/20 ring-slate-400/40" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="py-2 text-center sm:py-4">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t("Know the")}{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">{t("whole world")}</span>?
        </h1>
        <p className="mt-2 text-slate-400">{t("195 countries. Maps, flags and capitals. Earn XP, coins and badges, and beat your friends.")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <button
            key={tile.title}
            type="button"
            onClick={() => onGo(tile.screen)}
            className={cn(
              "group relative flex items-start gap-3 rounded-2xl bg-gradient-to-br p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:brightness-125",
              tile.className,
            )}
          >
            <span className="text-4xl transition group-hover:scale-110">{tile.emoji}</span>
            <span>
              <span className="block text-lg font-black text-white">{t(tile.title)}</span>
              <span className="block text-sm text-slate-300">{t(tile.text)}</span>
            </span>
            {tile.badge && <span className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">{tile.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
