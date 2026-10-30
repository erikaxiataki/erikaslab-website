"use client";

import { Heart, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Scope } from "@/lib/atlas/countries";
import { type Answer, DIFFICULTY, type Difficulty, type Mode, generateQuestions, streakMultiplier } from "@/lib/atlas/game";
import { useI18n } from "@/lib/atlas/i18n";
import type { RoundResult } from "@/lib/atlas/progress";
import { getProfile } from "@/lib/atlas/store";
import { QuestionView } from "./QuestionView";
import { GameButton, Panel } from "./ui";

export type SoloConfig = {
  mode: Mode;
  scope: Scope;
  difficulty: Difficulty;
  seed: number;
  /** Number of questions; ignored in survival. */
  count: number;
  survival?: boolean;
  daily?: boolean;
  /** Prefer countries not asked recently (random games only; daily and challenges must repeat exactly). */
  fresh?: boolean;
};

export function streaks(answers: Answer[]) {
  let streak = 0;
  let bestStreak = 0;
  for (const a of answers) {
    streak = a.correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  return { streak, bestStreak };
}

export function SoloGame({
  config,
  onFinish,
  onQuit,
  label,
}: {
  config: SoloConfig;
  onFinish: (r: RoundResult) => void;
  onQuit: () => void;
  label?: string;
}) {
  const { mode, scope, difficulty, seed, survival } = config;
  const { t } = useI18n();
  // Built once per game: the profile changes mid-game (coins, progress) and must not reshuffle it.
  const [questions] = useState(() => {
    const p = config.fresh ? getProfile() : null;
    return generateQuestions(seed, mode, scope, difficulty, survival ? 400 : config.count, p ? { recent: p.recent, mastery: p.mastery } : undefined);
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const { streak, bestStreak } = useMemo(() => streaks(answers), [answers]);
  const lives = DIFFICULTY[difficulty].lives - answers.filter((a) => !a.correct).length;
  const score = answers.reduce((s, a) => s + a.points, 0);
  const current = answers[index];
  const isLast = survival ? lives <= 0 || index === questions.length - 1 : index === questions.length - 1;

  const finish = useCallback(() => {
    onFinish({
      mode,
      scope,
      difficulty,
      questions: questions.slice(0, answers.length),
      answers,
      score,
      bestStreak,
      daily: config.daily,
      fixedLength: !survival,
    });
  }, [onFinish, mode, scope, difficulty, questions, answers, score, bestStreak, config.daily, survival]);

  const next = useCallback(() => (isLast ? finish() : setIndex((i) => i + 1)), [isLast, finish]);

  const handleAnswer = useCallback((a: Answer) => setAnswers((prev) => [...prev, a]), []);

  // Right answers move on by themselves; misses wait so there's time to learn.
  useEffect(() => {
    if (!current?.correct || isLast) return;
    const id = setTimeout(next, 1400);
    return () => clearTimeout(id);
  }, [current, isLast, next]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && next();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, next]);

  const mult = streakMultiplier(streak);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <button type="button" onClick={onQuit} aria-label={t("Quit game")} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="size-5" />
        </button>
        {label && <span className="font-bold text-violet-300">{t(label)}</span>}
        <span className="text-sm text-slate-400">
          {survival ? t("Question {n}", { n: index + 1 }) : t("Question {n} / {total}", { n: index + 1, total: questions.length })}
        </span>
        <span className="ml-auto text-lg font-black text-white tabular-nums">{t("{n} pts", { n: score })}</span>
        <span className={streak >= 5 ? "font-black text-orange-400" : "text-slate-300"}>
          🔥 {streak}
          {mult > 1 && <span className="ml-1 rounded bg-orange-500 px-1.5 text-xs text-white">x{mult}</span>}
        </span>
        {survival && (
          <span className="flex gap-0.5" aria-label={t("{n} lives left", { n: lives })}>
            {Array.from({ length: DIFFICULTY[difficulty].lives }, (_, i) => (
              <Heart key={i} className={i < lives ? "size-5 fill-red-500 text-red-500" : "size-5 text-slate-600"} />
            ))}
          </span>
        )}
      </Panel>

      <Panel>
        <QuestionView
          key={index}
          question={questions[index]}
          difficulty={difficulty}
          scope={scope}
          streak={streak}
          hints
          onAnswer={handleAnswer}
          footer={() => (
            <GameButton tone={isLast ? "warn" : "go"} onClick={next} autoFocus>
              {isLast ? (survival && lives <= 0 ? t("💀 Out of lives · See results") : t("🏁 See results")) : t("Next ➜")}
            </GameButton>
          )}
        />
      </Panel>
    </div>
  );
}
