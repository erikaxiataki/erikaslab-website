"use client";

import { Dices } from "lucide-react";
import { SCOPE_EMOJI, type Scope } from "@/lib/atlas/countries";
import { DIFFICULTY, type Difficulty, MODES, type Mode } from "@/lib/atlas/game";
import { useI18n } from "@/lib/atlas/i18n";
import { AVATARS, randomNickname } from "@/lib/atlas/identity";
import { BADGES, levelFromXp, newProfile, rankFor } from "@/lib/atlas/progress";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { masteryColors } from "./Explore";
import { SaveRestore } from "./SaveRestore";
import { GameButton, Panel, ProgressBar, SectionTitle } from "./ui";
import { WorldMap } from "./WorldMap";

export function ProfileScreen() {
  const profile = useProfile();
  const { t, nick, num } = useI18n();
  if (!profile) return null;
  const { level, into, need } = levelFromXp(profile.xp);
  const rank = rankFor(level);
  const bests = Object.entries(profile.best)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="text-center">
          <div className="text-6xl">{profile.avatar}</div>
          <div className="mt-1 text-xl font-black text-white">{nick(profile.name)}</div>
          <div className="text-sm text-violet-300">
            {rank.emoji} {t(rank.title)} · {t("Level {n}", { n: level })}
          </div>
          <button
            type="button"
            onClick={() => setProfile((p) => ({ ...p, name: randomNickname() }))}
            className="mt-1 inline-flex items-center gap-1 text-xs text-violet-300 hover:underline"
          >
            <Dices className="size-3" /> {t("New nickname")}
          </button>
        </div>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm text-slate-300">
            <span>{t("XP to level {n}", { n: level + 1 })}</span>
            <span>
              {into} / {need}
            </span>
          </div>
          <ProgressBar value={into / need} className="h-3" />
          <p className="mt-3 mb-1 text-sm font-bold text-slate-300">{t("Pick your avatar")}</p>
          <div className="flex flex-wrap gap-1">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, avatar: a }))}
                className={cn("rounded-lg p-1 text-2xl", profile.avatar === a ? "bg-violet-500/40 ring-2 ring-violet-300" : "hover:bg-slate-800")}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["🪙", "Coins", profile.coins],
          ["🎮", "Games", profile.gamesPlayed],
          ["✅", "Right answers", profile.totalCorrect],
          ["🔥", "Best streak", profile.bestStreak],
          ["📅", "Daily streak", profile.dailyStreak],
          ["🏳️", "Flags", profile.flagCorrect],
          ["🗺️", "Map finds", profile.mapCorrect],
          ["🥇", "Online wins", profile.onlineWins],
        ].map(([e, label, v]) => (
          <Panel key={label as string} className="p-3 text-center">
            <div className="text-xl font-black text-white">
              {e} {num(v as number)}
            </div>
            <div className="text-xs text-slate-400">{t(label as string)}</div>
          </Panel>
        ))}
      </div>

      <Panel>
        <SectionTitle className="mb-3">
          🏅 {t("Badges")} <span className="text-base text-slate-400">({profile.badges.length}/{BADGES.length})</span>
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BADGES.map((b) => {
            const got = profile.badges.includes(b.id);
            return (
              <div key={b.id} className={cn("rounded-xl p-3 text-center ring-1", got ? "bg-violet-500/20 ring-violet-300/40" : "bg-slate-800/60 ring-white/5")}>
                <div className={cn("text-3xl", !got && "opacity-25 grayscale")}>{b.emoji}</div>
                <div className={cn("font-bold", got ? "text-white" : "text-slate-500")}>{t(b.name)}</div>
                <div className="text-xs text-slate-400">{t(b.how)}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <SectionTitle className="mb-1">{t("🗺️ Your knowledge map")}</SectionTitle>
        <p className="mb-3 text-sm text-slate-400">{t("Countries light up as you get them right. Can you color the whole world?")}</p>
        <WorldMap colors={masteryColors(profile.mastery)} showNames />
      </Panel>

      <Panel>
        <SectionTitle className="mb-3">{t("🏆 Personal bests")}</SectionTitle>
        {bests.length === 0 ? (
          <p className="text-slate-400">{t("Play a game to set your first record!")}</p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {bests.map(([key, score], i) => {
              const [mode, scope, diff, survival] = key.split("|") as [Mode, Scope, Difficulty, string?];
              const m = MODES.find((x) => x.id === mode);
              return (
                <li key={key} className="flex items-center gap-2 rounded-lg bg-slate-800/70 px-3 py-2">
                  <span className="w-6 font-black text-slate-400">{i + 1}</span>
                  <span>
                    {m?.emoji} {m && t(m.label)}
                    {survival && ` · ${t("Survival")}`}
                  </span>
                  <span className="text-sm text-slate-400">
                    {SCOPE_EMOJI[scope]} {t(scope)} · {DIFFICULTY[diff] && t(DIFFICULTY[diff].label)}
                  </span>
                  <span className="ml-auto font-black text-white tabular-nums">{num(score)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <SaveRestore />

      <div className="text-center">
        <GameButton
          tone="ghost"
          className="text-xs"
          onClick={() => {
            if (window.confirm(t("Reset ALL progress, badges and coins? This can't be undone."))) setProfile({ ...newProfile(), lang: profile.lang });
          }}
        >
          {t("Reset progress")}
        </GameButton>
      </div>
    </div>
  );
}
