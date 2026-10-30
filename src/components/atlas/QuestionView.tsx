"use client";

import { Clock } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { Country, Scope } from "@/lib/atlas/countries";
import { type Answer, type Difficulty, type Question, scoreAnswer, timeLimitMs } from "@/lib/atlas/game";
import { useI18n } from "@/lib/atlas/i18n";
import { matchTyped } from "@/lib/atlas/names";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { Flag, ProgressBar } from "./ui";
import { MAP_COLORS, type MapFocus, WorldMap, countryFocus } from "./WorldMap";

type Props = {
  question: Question;
  difficulty: Difficulty;
  scope: Scope;
  streak: number;
  onAnswer: (a: Answer) => void;
  /** Coin-powered hints (solo games only). */
  hints?: boolean;
  /** Rendered under the question once it has been answered (e.g. a Next button). */
  footer?: (a: Answer) => ReactNode;
};

const HINT_COST = { fifty: 30, time: 15, zoom: 25, letter: 20 };

export function QuestionView({ question, difficulty, scope, streak, onAnswer, hints, footer }: Props) {
  const profile = useProfile();
  const { t, name, capital, num } = useI18n();
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const [extraMs, setExtraMs] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [hintFocus, setHintFocus] = useState<MapFocus | null>(null);
  const [typed, setTyped] = useState("");
  const [gaveAnswer, setGaveAnswer] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const answered = useRef(false);

  const limit = timeLimitMs(question.kind, difficulty) + extraMs;
  const left = Math.max(0, limit - (now - start));
  const { country, kind, options } = question;

  const submit = useCallback(
    (picked: Country | null) => {
      if (answered.current) return;
      answered.current = true;
      const a = scoreAnswer({ question, picked, ms: Math.min(Date.now() - start, limit), difficulty, streak });
      play(a.correct ? "correct" : "wrong");
      setAnswer(a);
      onAnswer(a);
    },
    [question, start, limit, difficulty, streak, onAnswer],
  );

  useEffect(() => {
    if (answer) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const remaining = limit - (t - start);
      if (remaining <= 0) submit(null);
      else if (remaining < 3500 && Math.floor(remaining / 1000) !== Math.floor((remaining + 100) / 1000)) play("tick");
    }, 100);
    return () => clearInterval(id);
  }, [answer, limit, start, submit]);

  const submitTyped = () => {
    if (!typed.trim() || answered.current) return;
    setGaveAnswer(true);
    const { correct, picked } = matchTyped(typed, country);
    submit(correct ? country : picked);
  };

  useEffect(() => {
    if (answer || kind === "map" || kind === "name") return;
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      const opt = options[i];
      if (opt && !removed.includes(opt.code)) submit(opt);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, kind, options, removed, submit]);

  const spend = (cost: number) => {
    if (!profile || profile.coins < cost) return false;
    setProfile((p) => ({ ...p, coins: p.coins - cost }));
    play("click");
    return true;
  };

  const picked = answer?.pickedCode;
  const colors: Record<string, string> = {};
  if (kind === "name" && !answer) colors[country.code] = MAP_COLORS.selected;
  if (answer) {
    if (picked && !answer.correct) colors[picked] = MAP_COLORS.wrong;
    colors[country.code] = MAP_COLORS.correct;
  }
  // Nudge the hint zoom off-center so it doesn't point straight at the answer.
  const offset = ((country.code.charCodeAt(0) * 7 + country.code.charCodeAt(1) * 13) % 21) - 10;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Clock className={cn("size-4", left < 4000 && !answer && "animate-pulse text-red-400")} />
        <ProgressBar
          value={answer ? 0 : left / limit}
          className="flex-1"
          barClassName={left < 4000 ? "from-red-500 to-orange-500" : undefined}
        />
        <span className="w-8 text-right font-mono tabular-nums">{answer ? "–" : Math.ceil(left / 1000)}</span>
      </div>

      <div className="text-center">
        {kind === "flag" && <Flag country={country} label={t("Mystery flag")} className="mx-auto mb-3 h-28 sm:h-36" />}
        {kind === "capital" && <Flag country={country} className="mx-auto mb-2 h-12" />}
        <h3 className="text-xl font-black text-white sm:text-2xl">
          {kind === "map" ? (
            <>
              {t("Find")} <span className="text-amber-300">{name(country)}</span>
            </>
          ) : kind === "name" ? (
            <>
              {t("Which country is")} <span className="text-amber-300">{t("highlighted")}</span>?
            </>
          ) : kind === "flag" ? (
            t("Which country has this flag?")
          ) : kind === "flag-reverse" ? (
            t("Which flag belongs to {country}?", { country: name(country) })
          ) : (
            t("What is the capital of {country}?", { country: name(country) })
          )}
        </h3>
      </div>

      {kind === "name" && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submitTyped();
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={!!answer}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={t("Type the country name…")}
            aria-label={t("Type the country name…")}
            className={cn(
              "min-w-0 flex-1 rounded-xl bg-slate-800 px-4 py-3 text-lg font-bold text-white ring-2 ring-white/10 outline-none placeholder:font-normal placeholder:text-slate-500 focus:ring-violet-400",
              answer && (answer.correct ? "ring-green-400" : "atlas-shake ring-red-400"),
            )}
          />
          {!answer && (
            <div className="flex gap-2">
              <button type="submit" disabled={!typed.trim()} className="flex-1 rounded-xl bg-violet-500 px-5 py-3 font-black text-white hover:bg-violet-400 disabled:opacity-40">
                {t("OK")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGaveAnswer(true);
                  submit(null);
                }}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700"
              >
                {t("Skip")}
              </button>
            </div>
          )}
        </form>
      )}
      {kind === "name" && showLetter && !answer && (
        <p className="text-center text-sm text-amber-200">
          {t("Starts with “{letter}” · {n} letters", {
            letter: name(country)[0],
            n: name(country).replace(/[^\p{L}]/gu, "").length,
          })}
        </p>
      )}

      {kind !== "map" && kind !== "name" && (
        <div className={cn("grid gap-2", kind === "flag-reverse" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
          {options.map((opt, i) => {
            const isAnswer = opt.code === country.code;
            const isPicked = opt.code === picked;
            const gone = removed.includes(opt.code);
            return (
              <button
                key={opt.code}
                type="button"
                disabled={!!answer || gone}
                onClick={() => submit(opt)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3 text-left font-bold ring-2 transition",
                  kind === "flag-reverse" && "justify-center p-2",
                  !answer && "bg-slate-800 ring-white/10 hover:bg-slate-700 hover:ring-violet-400",
                  answer && isAnswer && "atlas-pop bg-green-600/30 ring-green-400",
                  answer && isPicked && !isAnswer && "atlas-shake bg-red-600/30 ring-red-400",
                  answer && !isAnswer && !isPicked && "bg-slate-800/50 opacity-50 ring-transparent",
                  gone && "invisible",
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-black/30 text-xs text-slate-300">{i + 1}</span>
                {kind === "flag-reverse" ? (
                  <Flag country={opt} label={t("Choice {n}", { n: i + 1 })} className="h-20 sm:h-24" />
                ) : (
                  <span className="text-white">{kind === "capital" ? capital(opt) : name(opt)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {hints && !answer && (
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {kind === "name" && (
            <HintButton
              label={t("First letter")}
              cost={HINT_COST.letter}
              disabled={showLetter}
              onClick={() => spend(HINT_COST.letter) && setShowLetter(true)}
            />
          )}
          {kind !== "map" && kind !== "name" && (
            <HintButton
              label={t("50 / 50")}
              cost={HINT_COST.fifty}
              disabled={removed.length > 0}
              onClick={() => {
                if (!spend(HINT_COST.fifty)) return;
                setRemoved(options.filter((o) => o.code !== country.code).slice(0, 2).map((o) => o.code));
              }}
            />
          )}
          {kind === "map" && (
            <HintButton
              label={t("Zoom closer")}
              cost={HINT_COST.zoom}
              disabled={!!hintFocus}
              onClick={() => {
                if (!spend(HINT_COST.zoom)) return;
                setHintFocus({ latlng: [country.latlng[0] + offset / 2, country.latlng[1] + offset], span: 45 });
              }}
            />
          )}
          <HintButton
            label={t("+10 sec")}
            cost={HINT_COST.time}
            disabled={extraMs > 0}
            onClick={() => spend(HINT_COST.time) && setExtraMs(10_000)}
          />
          <span className="self-center text-slate-400">{t("You have {n} 🪙", { n: profile?.coins ?? 0 })}</span>
        </div>
      )}

      {answer && (
        <div className={cn("atlas-pop rounded-xl px-4 py-3 text-center", answer.correct ? "bg-green-500/15" : "bg-red-500/15")}>
          <p className="text-lg font-black text-white">
            {answer.correct ? t("✅ Correct! +{n}", { n: answer.points }) : picked || gaveAnswer ? t("❌ Not quite!") : t("⏰ Time's up!")}
            {!answer.correct && answer.points > 0 && <span className="text-amber-300"> {t("+{n} for being close", { n: answer.points })}</span>}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {!answer.correct && (
              <>
                {t("It was")} <b className="text-white">{name(country)}</b>
                {answer.distanceKm !== undefined && <> · {t("you were {km} km away", { km: num(answer.distanceKm) })}</>}
                {" · "}
              </>
            )}
            {t("Capital:")} <b className="text-white">{capital(country)}</b> · {t(country.subregion)}
          </p>
          {footer && <div className="mt-3">{footer(answer)}</div>}
        </div>
      )}

      <WorldMap
        scope={scope}
        colors={colors}
        onPick={kind === "map" && !answer ? submit : undefined}
        focus={answer || kind === "name" ? wideFocus(country, !!answer) : hintFocus}
        className={cn(kind !== "map" && kind !== "name" && !answer && "opacity-60")}
      />
    </div>
  );
}

/** Name It shows the highlighted country with plenty of surroundings, so its shape and neighbors help. */
function wideFocus(country: Country, answered: boolean): MapFocus {
  const f = countryFocus(country);
  return answered ? f : { latlng: f.latlng, span: Math.min(90, Math.max(30, f.span * 2.5)) };
}

function HintButton({ label, cost, disabled, onClick }: { label: string; cost: number; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-amber-400/15 px-3 py-1.5 font-bold text-amber-200 ring-1 ring-amber-300/40 hover:bg-amber-400/25 disabled:opacity-40"
    >
      💡 {label} · {cost}🪙
    </button>
  );
}
