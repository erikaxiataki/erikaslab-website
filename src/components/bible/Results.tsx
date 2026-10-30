"use client";

import { BOOK_BY_ID } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import type { Rewards } from "@/lib/bible/progress";
import { Confetti, GameButton, Panel, Selah, Stars } from "./ui";

/** Shared end-of-game screen: the headline, stars, rewards, badges and what to practice next. */
export function Results({
  headline,
  sub,
  stars,
  rewards,
  missed = [],
  passed = true,
  onAgain,
  onHome,
  homeLabel,
}: {
  headline: string;
  sub?: string;
  stars?: number;
  rewards: Rewards;
  /** Book ids that were missed: shown as "practice these". */
  missed?: string[];
  passed?: boolean;
  onAgain?: () => void;
  onHome: () => void;
  homeLabel?: string;
}) {
  const { t, book: name, num } = useI18n();
  const uniqueMissed = [...new Set(missed)].map((id) => BOOK_BY_ID.get(id)!).filter(Boolean);
  return (
    <div className="flex flex-col gap-4">
      {passed && <Confetti />}
      <Panel className="bible-pop flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-4xl font-black text-white sm:text-5xl">{headline}</p>
        {sub && <p className="text-lg text-stone-300">{sub}</p>}
        {stars !== undefined && <Stars n={stars} className="text-4xl" />}
        <div className="flex flex-wrap justify-center gap-2 text-lg font-black">
          <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sky-200">+{num(rewards.xp)} XP</span>
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">+{num(rewards.coins)} 🪙</span>
          {rewards.newBest && <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-200">{t("⭐ New record!")}</span>}
          {rewards.leveledUp && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">{t("⬆️ Level up!")}</span>}
        </div>
        {rewards.newBadges.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold text-amber-200">{t("New badge!")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {rewards.newBadges.map((b) => (
                <span key={b.id} className="bible-pop rounded-2xl bg-amber-400/15 px-3 py-2 ring-1 ring-amber-300/40">
                  <span className="text-3xl">{b.emoji}</span>
                  <span className="block text-sm font-black text-white">{t(b.name)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {onAgain && (
            <GameButton tone="go" className="text-lg" onClick={onAgain}>
              {t("🔁 Play again")}
            </GameButton>
          )}
          <GameButton tone="ghost" className="text-lg" onClick={onHome}>
            {homeLabel ?? t("🏠 Menu")}
          </GameButton>
        </div>
      </Panel>
      {uniqueMissed.length > 0 && (
        <Panel className="flex flex-col gap-2">
          <Selah mood="think">{t("These books will come back soon so you can practice them:")}</Selah>
          <div className="flex flex-wrap gap-1.5">
            {uniqueMissed.map((b) => (
              <span key={b.id} className="rounded-lg bg-stone-800 px-2 py-1 text-sm font-bold text-white">
                {b.emoji} {name(b)} <span className="text-stone-400">#{b.order}</span>
              </span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
