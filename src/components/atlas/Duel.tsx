"use client";

import { Dices } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { type Answer, generateQuestions, randomSeed } from "@/lib/atlas/game";
import { useI18n } from "@/lib/atlas/i18n";
import { AVATARS, randomAvatar, randomNickname } from "@/lib/atlas/identity";
import { applyRound } from "@/lib/atlas/progress";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { QuestionView } from "./QuestionView";
import { type Settings, SettingsPicker } from "./SettingsPicker";
import { streaks } from "./SoloGame";
import { Confetti, GameButton, Panel, SectionTitle } from "./ui";

const PER_PLAYER = 8;

type DuelPlayer = { name: string; avatar: string };

/** Two players, one device: take turns answering, highest score wins. */
export function Duel({ onHome }: { onHome: () => void }) {
  const profile = useProfile();
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings>({ mode: "mix", scope: "World", difficulty: "normal" });
  const [p2, setP2] = useState<DuelPlayer>(() => ({ name: randomNickname(), avatar: randomAvatar() }));
  const [seed, setSeed] = useState<number | null>(null);
  const players: DuelPlayer[] = [{ name: profile?.name ?? "Player 1", avatar: profile?.avatar ?? "🦊" }, p2];

  if (seed === null) {
    return (
      <Panel className="flex flex-col gap-4">
        <SectionTitle>{t("⚔️ Duel: same device")}</SectionTitle>
        <p className="text-slate-300">{t("Take turns on one phone or computer. {n} questions each. Highest score wins!", { n: PER_PLAYER })}</p>
        <div className="grid grid-cols-2 gap-3">
          <PlayerCard player={players[0]} label={t("Player 1 (you)")} />
          <PlayerCard
            player={p2}
            label={t("Player 2")}
            onReroll={() => setP2({ name: randomNickname(), avatar: p2.avatar })}
            onAvatar={() => setP2({ ...p2, avatar: AVATARS[(AVATARS.indexOf(p2.avatar) + 1) % AVATARS.length] })}
          />
        </div>
        <SettingsPicker value={settings} onChange={setSettings} />
        <GameButton tone="go" className="self-start text-lg" onClick={() => setSeed(randomSeed())}>
          {t("⚔️ Start duel")}
        </GameButton>
      </Panel>
    );
  }
  return (
    <DuelGame
      key={seed}
      seed={seed}
      settings={settings}
      players={players}
      onAgain={() => setSeed(randomSeed())}
      onHome={onHome}
      onDone={() => {
        if (profile) setProfile((p) => applyRound(p, { ...settings, questions: [], answers: [], score: 0, bestStreak: 0 }, { duelsPlayed: 1 }).profile);
      }}
    />
  );
}

function PlayerCard({ player, label, onReroll, onAvatar }: { player: DuelPlayer; label: string; onReroll?: () => void; onAvatar?: () => void }) {
  const { t, nick } = useI18n();
  return (
    <div className="rounded-xl bg-slate-800 p-3 text-center">
      <button type="button" disabled={!onAvatar} onClick={onAvatar} className="text-4xl" aria-label={t("Change avatar")}>
        {player.avatar}
      </button>
      <div className="font-bold text-white">{nick(player.name)}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {onReroll && (
        <button type="button" onClick={onReroll} className="mt-1 inline-flex items-center gap-1 text-xs text-violet-300 hover:underline">
          <Dices className="size-3" /> {t("New name")}
        </button>
      )}
    </div>
  );
}

function DuelGame({
  seed,
  settings,
  players,
  onAgain,
  onHome,
  onDone,
}: {
  seed: number;
  settings: Settings;
  players: DuelPlayer[];
  onAgain: () => void;
  onHome: () => void;
  onDone: () => void;
}) {
  const { t, nick, num } = useI18n();
  const questions = useMemo(
    () => generateQuestions(seed, settings.mode, settings.scope, settings.difficulty, PER_PLAYER * 2),
    [seed, settings],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [handoff, setHandoff] = useState(true);
  const turn = index % 2;

  const scoreOf = (p: number) => answers.filter((_, i) => i % 2 === p).reduce((s, a) => s + a.points, 0);
  const streakOf = (p: number) => streaks(answers.filter((_, i) => i % 2 === p)).streak;

  const onAnswer = useCallback((a: Answer) => setAnswers((prev) => [...prev, a]), []);

  const next = () => {
    if (index === questions.length - 1) {
      play("win");
      onDone();
      setIndex(index + 1);
      return;
    }
    setIndex(index + 1);
    setHandoff(true);
  };

  const scores = [scoreOf(0), scoreOf(1)];
  const board = (
    <div className="grid grid-cols-2 gap-2">
      {players.map((p, i) => (
        <div key={i} className={cn("rounded-xl p-2 text-center ring-2", index < questions.length && turn === i ? "bg-violet-500/20 ring-violet-400" : "bg-slate-800 ring-transparent")}>
          <span className="text-2xl">{p.avatar}</span> <span className="font-bold text-white">{nick(p.name)}</span>
          <div className="text-xl font-black text-white tabular-nums">{num(scores[i])}</div>
        </div>
      ))}
    </div>
  );

  if (index >= questions.length) {
    const winner = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
    return (
      <Panel className="flex flex-col gap-4 text-center">
        <Confetti />
        <p className="text-4xl">{winner === null ? "🤝" : players[winner].avatar}</p>
        <p className="text-3xl font-black text-white">{winner === null ? t("It's a tie!") : t("{name} wins!", { name: nick(players[winner].name) })}</p>
        {board}
        <div className="flex justify-center gap-2">
          <GameButton tone="go" onClick={onAgain}>
            {t("🔁 Rematch")}
          </GameButton>
          <GameButton tone="ghost" onClick={onHome}>
            {t("🏠 Menu")}
          </GameButton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel className="py-3">{board}</Panel>
      {handoff ? (
        <Panel className="atlas-pop flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-6xl">{players[turn].avatar}</p>
          <p className="text-2xl font-black text-white">{t("{name}, your turn!", { name: nick(players[turn].name) })}</p>
          <p className="text-slate-400">
            {t("Question {n} of {total}. Pass the device 📱", { n: Math.floor(index / 2) + 1, total: PER_PLAYER })}
          </p>
          <GameButton tone="go" className="text-lg" onClick={() => setHandoff(false)} autoFocus>
            {t("I'm ready!")}
          </GameButton>
        </Panel>
      ) : (
        <Panel>
          <QuestionView
            key={index}
            question={questions[index]}
            difficulty={settings.difficulty}
            scope={settings.scope}
            streak={streakOf(turn)}
            onAnswer={onAnswer}
            footer={() => (
              <GameButton tone="go" onClick={next} autoFocus>
                {index === questions.length - 1 ? t("🏁 Final scores") : t("Next player ➜")}
              </GameButton>
            )}
          />
        </Panel>
      )}
    </div>
  );
}
