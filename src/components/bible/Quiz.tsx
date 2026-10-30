"use client";

import { Clock, Heart, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { play } from "@/lib/bible/sound";
import { BOOKS, BOOK_BY_ID, type Book, SECTION_BY_ID, type Scope, type SectionId, sectionOf } from "@/lib/bible/books";
import { type Answer, DIFFICULTY, type Difficulty, type Mode, type Question, comboFor, makeQuestions, scoreFor, timeLimitMs } from "@/lib/bible/game";
import { useI18n } from "@/lib/bible/i18n";
import type { RoundResult } from "@/lib/bible/progress";
import { getProfile, setProfile, useProfile } from "@/lib/bible/store";
import { cn } from "@/lib/utils";
import { BookTile, GameButton, Panel, ProgressBar, Selah } from "./ui";

export type QuizConfig = {
  mode: Mode;
  scope: Scope;
  difficulty: Difficulty;
  seed: number;
  /** Number of questions; ignored in survival. */
  count: number;
  survival?: boolean;
  daily?: boolean;
  /** Quest Map practice round for this island. */
  island?: SectionId;
};

const FIFTY_COST = 10;

const CHEERS = ["Great job!", "You got it!", "Super!", "Brilliant!", "Well done!", "Yes! Keep going!"];
const COMBO_CHEERS = ["You're on fire! 🔥", "Combo! Amazing!", "Nobody can stop you!"];

function streaks(answers: Answer[]) {
  let streak = 0;
  let bestStreak = 0;
  for (const a of answers) {
    streak = a.correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  return { streak, bestStreak };
}

export function QuizGame({ config, label, onFinish, onQuit }: { config: QuizConfig; label?: string; onFinish: (r: RoundResult) => void; onQuit: () => void }) {
  const { mode, scope, difficulty, seed, survival } = config;
  const { t } = useI18n();
  // Built once per game; the daily challenge ignores mastery so it is the same for everyone.
  const [questions] = useState(() => makeQuestions(mode, scope, difficulty, seed, survival ? 300 : config.count, config.daily ? {} : getProfile().mastery));
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
      survival,
      island: config.island,
    });
  }, [onFinish, mode, scope, difficulty, questions, answers, score, bestStreak, config.daily, config.island, survival]);

  const next = useCallback(() => (isLast ? finish() : setIndex((i) => i + 1)), [isLast, finish]);

  // Right answers move on by themselves; misses wait so there's time to learn.
  useEffect(() => {
    if (!current?.correct || isLast) return;
    const id = setTimeout(next, questions[index].kind === "testament" ? 700 : 1500);
    return () => clearTimeout(id);
  }, [current, isLast, next, questions, index]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && next();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, next]);

  const mult = comboFor(streak);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <button type="button" onClick={onQuit} aria-label={t("Quit game")} className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white">
          <X className="size-5" />
        </button>
        {label && <span className="font-bold text-amber-300">{label}</span>}
        <span className="text-sm text-stone-400">
          {survival ? t("Question {n}", { n: index + 1 }) : t("Question {n} / {total}", { n: index + 1, total: questions.length })}
        </span>
        <span className="ml-auto text-lg font-black text-white tabular-nums">{t("{n} pts", { n: score })}</span>
        <span className={cn(streak >= 3 ? "font-black text-orange-400" : "text-stone-300", mult > 1 && "bible-bounce")}>
          🔥 {streak}
          {mult > 1 && <span className="ml-1 rounded bg-orange-500 px-1.5 text-xs text-white">x{mult}</span>}
        </span>
        {survival && (
          <span className="flex gap-0.5" aria-label={t("{n} lives left", { n: lives })}>
            {Array.from({ length: DIFFICULTY[difficulty].lives }, (_, i) => (
              <Heart key={i} className={i < lives ? "size-5 fill-red-500 text-red-500" : "size-5 text-stone-600"} />
            ))}
          </span>
        )}
      </Panel>
      {!survival && <ProgressBar value={(index + (current ? 1 : 0)) / questions.length} className="h-1.5" />}
      <Panel>
        <QuestionCard
          key={index}
          question={questions[index]}
          difficulty={difficulty}
          streak={streak}
          onAnswer={(a) => setAnswers((prev) => [...prev, a])}
          footer={
            <GameButton tone={isLast ? "primary" : "go"} onClick={next} autoFocus>
              {isLast ? (survival && lives <= 0 ? t("💔 Out of lives · See results") : t("🏁 See results")) : t("Next ➜")}
            </GameButton>
          }
        />
      </Panel>
    </div>
  );
}

function QuestionCard({
  question,
  difficulty,
  streak,
  onAnswer,
  footer,
}: {
  question: Question;
  difficulty: Difficulty;
  streak: number;
  onAnswer: (a: Answer) => void;
  footer: React.ReactNode;
}) {
  const profile = useProfile();
  const { t, book: name, summary, section: sectionName } = useI18n();
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const answered = useRef(false);
  const { kind, book, options } = question;
  const limit = timeLimitMs(kind, difficulty);
  const left = Math.max(0, limit - (now - start));

  const submit = useCallback(
    (picked: string | null) => {
      if (answered.current) return;
      answered.current = true;
      const ms = Math.min(Date.now() - start, limit);
      const correct = picked === question.answer;
      const a: Answer = { correct, ms, picked: picked ?? undefined, points: correct ? scoreFor(ms, limit, streak + 1, difficulty) : 0 };
      play(correct ? "correct" : "wrong");
      setAnswer(a);
      onAnswer(a);
    },
    [question.answer, start, limit, streak, difficulty, onAnswer],
  );

  useEffect(() => {
    if (answer) return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      const remaining = limit - (ts - start);
      if (remaining <= 0) submit(null);
      else if (remaining < 3500 && Math.floor(remaining / 1000) !== Math.floor((remaining + 100) / 1000)) play("tick");
    }, 100);
    return () => clearInterval(id);
  }, [answer, limit, start, submit]);

  // Keyboard: 1–6 picks an option; arrows for Old (←) / New (→).
  useEffect(() => {
    if (answer) return;
    const onKey = (e: KeyboardEvent) => {
      if (kind === "testament" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return submit(e.key === "ArrowLeft" ? "OT" : "NT");
      const opt = options[Number(e.key) - 1];
      if (opt && !removed.includes(opt)) submit(opt);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, kind, options, removed, submit]);

  const fifty = () => {
    if (!profile || profile.coins < FIFTY_COST || answer) return;
    setProfile((p) => ({ ...p, coins: p.coins - FIFTY_COST }));
    play("click");
    // Leave the answer and one wrong choice.
    const wrong = options.filter((o) => o !== question.answer);
    setRemoved(wrong.slice(0, wrong.length - 1));
  };

  const optState = (id: string) => (!answer ? "idle" : id === question.answer ? "right" : id === answer.picked ? "wrong" : "dim");
  const optClass = (id: string) =>
    cn(
      optState(id) === "right" && "bg-emerald-600 ring-2 ring-emerald-300 hover:bg-emerald-600",
      optState(id) === "wrong" && "bible-shake bg-red-600/80 ring-2 ring-red-300 hover:bg-red-600/80",
      optState(id) === "dim" && "opacity-40",
      removed.includes(id) && "invisible",
    );

  let prompt: React.ReactNode;
  switch (kind) {
    case "next":
    case "before":
      prompt = (
        <>
          <p className="text-stone-300">{kind === "next" ? t("Which book comes right after…") : t("Which book comes right before…")}</p>
          <BigBook book={question.clue!} />
        </>
      );
      break;
    case "missing":
      prompt = (
        <>
          <p className="text-stone-300">{t("Which book is missing?")}</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {question.row!.map((b, i) =>
              b ? (
                <span key={i} className="rounded-lg bg-stone-800 px-2 py-1 text-sm font-bold text-white" style={{ boxShadow: `inset 4px 0 0 ${sectionOf(b).color}` }}>
                  {name(b)}
                </span>
              ) : (
                <span key={i} className={cn("rounded-lg border-2 border-dashed px-3 py-1 text-sm font-black", answer ? "border-emerald-400 text-emerald-300" : "animate-pulse border-amber-400 text-amber-300")}>
                  {answer ? name(book) : "?"}
                </span>
              ),
            )}
          </div>
        </>
      );
      break;
    case "who":
      prompt = (
        <>
          <p className="text-stone-300">{t("Which book is this?")}</p>
          <p className="mx-auto max-w-xl rounded-2xl bg-amber-50 px-4 py-3 text-lg font-bold text-stone-800 shadow-lg">“{summary(book)}”</p>
        </>
      );
      break;
    case "section":
      prompt = (
        <>
          <p className="text-stone-300">{t("Which part of the Bible is it in?")}</p>
          <BigBook book={book} />
        </>
      );
      break;
    case "testament":
      prompt = (
        <>
          <p className="text-stone-300">{t("Old Testament or New Testament?")}</p>
          <BigBook book={book} />
        </>
      );
      break;
  }

  // What Selah says after the answer: always show the right answer in context, so every miss teaches something.
  const prev = BOOKS[book.order - 2];
  const after = BOOKS[book.order];
  const sec = sectionOf(book);
  const explain = (
    <div className="flex flex-col items-center gap-2">
      {(kind === "next" || kind === "before" || kind === "missing") && (
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
          {prev && <span className="rounded bg-stone-800 px-2 py-1 text-stone-300">{name(prev)}</span>}
          <span>➜</span>
          <span className="rounded bg-emerald-600 px-2 py-1 font-black text-white">
            {book.emoji} {name(book)}
          </span>
          <span>➜</span>
          {after && <span className="rounded bg-stone-800 px-2 py-1 text-stone-300">{name(after)}</span>}
        </div>
      )}
      <p className="text-sm text-stone-300">
        {t("{book} is book #{n}, in {section}.", { book: name(book), n: book.order, section: `${sec.emoji} ${sectionName(sec)}` })}
        {kind !== "who" && <span className="block text-stone-400 italic">“{summary(book)}”</span>}
      </p>
    </div>
  );

  const pick = answer?.picked;
  const pickedBook = pick ? BOOK_BY_ID.get(pick) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-stone-300">
        <Clock className={cn("size-4", left < 4000 && !answer && "animate-pulse text-red-400")} />
        <ProgressBar value={answer ? 0 : left / limit} className="flex-1" barClassName={left < 4000 ? "from-red-500 to-orange-500" : undefined} />
        <span className="w-8 text-right font-mono tabular-nums">{answer ? "–" : Math.ceil(left / 1000)}</span>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">{prompt}</div>

      {kind === "testament" ? (
        <div className="grid grid-cols-2 gap-3">
          {(["OT", "NT"] as const).map((id) => (
            <button
              key={id}
              type="button"
              disabled={!!answer}
              onClick={() => submit(id)}
              className={cn(
                "rounded-2xl px-3 py-6 text-xl font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 sm:text-2xl",
                id === "OT" ? "bg-gradient-to-br from-amber-600 to-orange-800" : "bg-gradient-to-br from-sky-600 to-indigo-800",
                optClass(id),
              )}
            >
              {id === "OT" ? `👈 ${t("Old Testament")}` : `${t("New Testament")} 👉`}
            </button>
          ))}
        </div>
      ) : kind === "section" ? (
        <div className={cn("grid gap-2", options.length > 3 ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-3")}>
          {options.map((id, i) => {
            const s = SECTION_BY_ID.get(id as SectionId)!;
            return (
              <button
                key={id}
                type="button"
                disabled={!!answer}
                onClick={() => submit(id)}
                className={cn("flex items-center gap-2 rounded-xl bg-stone-800 px-3 py-3 text-left font-bold text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-stone-700", optClass(id))}
                style={{ boxShadow: `inset 6px 0 0 ${s.color}` }}
              >
                <span className="hidden text-xs text-stone-400 sm:inline">{i + 1}</span>
                <span className="text-xl">{s.emoji}</span>
                <span className="leading-tight">{sectionName(s)}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((id) => (
            <BookTile key={id} book={BOOK_BY_ID.get(id)!} disabled={!!answer} onClick={() => submit(id)} className={cn("py-3 text-lg", optClass(id))} />
          ))}
        </div>
      )}

      {!answer && kind !== "testament" && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={fifty}
            disabled={!profile || profile.coins < FIFTY_COST || removed.length > 0}
            className="rounded-full bg-stone-800 px-3 py-1.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-200/20 hover:bg-stone-700 disabled:opacity-40"
          >
            {t("🦉 Ask Selah: remove wrong answers ({n} 🪙)", { n: FIFTY_COST })}
          </button>
        </div>
      )}

      {answer && (
        <div className="bible-pop flex flex-col items-center gap-3">
          <Selah mood={answer.correct ? (streak + 1 >= 3 ? "party" : "happy") : "think"}>
            {answer.correct
              ? `${t((streak + 1 >= 3 ? COMBO_CHEERS : CHEERS)[(book.order + streak) % (streak + 1 >= 3 ? COMBO_CHEERS.length : CHEERS.length)])} +${answer.points}`
              : !answer.picked
                ? t("Time's up! Here's the answer:")
                : pickedBook && kind !== "who"
                  ? t("Not quite! {picked} is book #{n}.", { picked: name(pickedBook), n: pickedBook.order })
                  : t("Not quite! Here's the answer:")}
          </Selah>
          {explain}
          {footer}
        </div>
      )}
    </div>
  );
}

function BigBook({ book }: { book: Book }) {
  const { book: name } = useI18n();
  const color = sectionOf(book).color;
  return (
    <div className="bible-pop flex items-center gap-3 rounded-2xl bg-stone-800 px-5 py-3 ring-2" style={{ boxShadow: `inset 8px 0 0 ${color}`, borderColor: color }}>
      <span className="text-4xl">{book.emoji}</span>
      <span className="text-3xl font-black text-white sm:text-4xl">{name(book)}</span>
    </div>
  );
}
