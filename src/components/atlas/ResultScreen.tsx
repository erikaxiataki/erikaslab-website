"use client";

import { useState } from "react";
import { type Challenge, challengeUrl, shareLink } from "@/lib/atlas/challenge";
import { MODES } from "@/lib/atlas/game";
import { translate, useI18n } from "@/lib/atlas/i18n";
import type { Rewards, RoundResult } from "@/lib/atlas/progress";
import { useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { Confetti, Flag, GameButton, Panel } from "./ui";

export function ResultScreen({
  result,
  rewards,
  seed,
  challenge,
  survival,
  onAgain,
  onHome,
}: {
  result: RoundResult;
  rewards: Rewards;
  seed: number;
  /** Set when this round answered a friend's challenge link. */
  challenge?: Challenge | null;
  survival?: boolean;
  onAgain: () => void;
  onHome: () => void;
}) {
  const profile = useProfile();
  const { t, lang, name, capital, nick, num } = useI18n();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const correct = result.answers.filter((a) => a.correct).length;
  const total = result.answers.length;
  const perfect = !survival && total > 0 && correct === total;
  const beat = challenge ? result.score - challenge.score : null;
  const party = perfect || rewards.leveledUp || rewards.newBest || (beat !== null && beat > 0);

  const headline = challenge
    ? beat! > 0
      ? t("🏆 You beat {name} by {n}!", { name: nick(challenge.name), n: beat! })
      : beat === 0
        ? t("🤝 Tie with {name}!", { name: nick(challenge.name) })
        : t("😤 {name} wins by {n}", { name: nick(challenge.name), n: -beat! })
    : perfect
      ? t("💯 PERFECT ROUND!")
      : correct / Math.max(1, total) >= 0.7
        ? t("🔥 Awesome!")
        : correct / Math.max(1, total) >= 0.4
          ? t("👍 Nice work!")
          : t("💪 Keep practicing!");

  const canChallenge = !survival && !result.daily && profile;
  const sendChallenge = async () => {
    if (!profile) return;
    const url = challengeUrl({
      seed,
      mode: result.mode,
      scope: result.scope,
      difficulty: result.difficulty,
      name: profile.name,
      avatar: profile.avatar,
      score: result.score,
    });
    const mode = translate(lang, MODES.find((m) => m.id === result.mode)?.label ?? "Atlas Quest");
    const how = await shareLink(url, t("I scored {n} in {mode} ({scope}). Can you beat me? 🌍", { n: result.score, mode, scope: t(result.scope) }));
    setShareMsg(how === "copied" ? t("Link copied! Send it to a friend 📋") : how === "shared" ? t("Challenge sent! 🚀") : t("Couldn't share. Try again?"));
  };

  return (
    <div className="flex flex-col gap-4">
      {party && <Confetti seed={result.score + 7} />}
      <Panel className="atlas-pop text-center">
        <p className="text-3xl font-black text-white sm:text-4xl">{headline}</p>
        {challenge && (
          <div className="mt-4 flex items-center justify-center gap-6 text-lg">
            <div>
              <div className="text-3xl">{profile?.avatar}</div>
              <div className="font-bold text-white">{num(result.score)}</div>
              <div className="text-xs text-slate-400">{t("You")}</div>
            </div>
            <div className="text-2xl font-black text-slate-500">VS</div>
            <div>
              <div className="text-3xl">{challenge.avatar}</div>
              <div className="font-bold text-white">{num(challenge.score)}</div>
              <div className="text-xs text-slate-400">{nick(challenge.name)}</div>
            </div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label={t("Score")} value={num(result.score)} />
          <Stat label={t("Correct")} value={`${correct}/${total}`} />
          <Stat label={t("Best streak")} value={`🔥 ${result.bestStreak}`} />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-bold">
          <Reward>+{rewards.xp} XP</Reward>
          <Reward>+{rewards.coins} 🪙</Reward>
          {rewards.newBest && <Reward className="bg-amber-400/20 text-amber-200">{t("⭐ New personal best!")}</Reward>}
          {rewards.leveledUp && <Reward className="bg-fuchsia-500/20 text-fuchsia-200">{t("⬆️ Level up!")}</Reward>}
        </div>
        {rewards.newBadges.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-300">{t("New badges unlocked!")}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {rewards.newBadges.map((b) => (
                <div key={b.id} className="atlas-pop rounded-xl bg-violet-500/20 px-3 py-2 ring-1 ring-violet-300/40">
                  <span className="text-2xl">{b.emoji}</span> <span className="font-bold text-white">{t(b.name)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <GameButton tone="go" onClick={onAgain}>
            {t("🔁 Play again")}
          </GameButton>
          {canChallenge && (
            <GameButton tone="warn" onClick={sendChallenge}>
              🎯 {challenge ? t("Challenge back") : t("Challenge a friend")}
            </GameButton>
          )}
          <GameButton tone="ghost" onClick={onHome}>
            {t("🏠 Menu")}
          </GameButton>
        </div>
        {shareMsg && <p className="mt-2 text-sm text-emerald-300">{shareMsg}</p>}
      </Panel>

      <Panel>
        <h3 className="mb-2 font-bold text-white">{t("Review")}</h3>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {result.answers.map((a, i) => {
            const c = result.questions[i].country;
            return (
              <li key={i} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", a.correct ? "bg-green-500/10" : "bg-red-500/10")}>
                <span>{a.correct ? "✅" : "❌"}</span>
                <Flag country={c} className="h-5 rounded-sm" />
                <span className="font-semibold text-white">{name(c)}</span>
                <span className="truncate text-xs text-slate-400">· {capital(c)}</span>
                <span className="ml-auto text-sm text-slate-300 tabular-nums">+{a.points}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/80 p-2">
      <div className="text-xl font-black text-white sm:text-2xl">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Reward({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200", className)}>{children}</span>;
}
