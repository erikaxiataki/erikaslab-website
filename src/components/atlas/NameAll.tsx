"use client";

import { Clock, Flag as FlagIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Country, QUIZ_COUNTRIES, SCOPES, SCOPE_EMOJI, type Scope, inScope } from "@/lib/atlas/countries";
import { useI18n } from "@/lib/atlas/i18n";
import { aliasKeys, findExact, normalizeName } from "@/lib/atlas/names";
import { type Rewards, allBestKey, applyNameAll } from "@/lib/atlas/progress";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { Chip, Confetti, Flag, GameButton, Panel, ProgressBar, SectionTitle } from "./ui";
import { MAP_COLORS, WorldMap } from "./WorldMap";

const TIMES: Record<"world" | "region", number[]> = { world: [5, 10, 15, 0], region: [2, 4, 6, 0] };
const CONTINENTS = SCOPES.filter((s) => s !== "World");

/** Type as many countries as you can before the timer runs out. */
export function NameAll({ onHome }: { onHome: () => void }) {
  const { t } = useI18n();
  const profile = useProfile();
  const [scope, setScope] = useState<Scope>("Europe");
  const [minutes, setMinutes] = useState(4);
  const [round, setRound] = useState(0);

  if (round > 0) return <NameAllGame key={round} scope={scope} minutes={minutes} onAgain={() => setRound((r) => r + 1)} onHome={onHome} />;

  const options = TIMES[scope === "World" ? "world" : "region"];
  const total = QUIZ_COUNTRIES.filter((c) => inScope(c, scope)).length;
  const best = profile?.allBest[allBestKey(scope, minutes)];

  return (
    <Panel className="flex flex-col gap-4">
      <SectionTitle>{t("⌨️ Name Them All")}</SectionTitle>
      <p className="text-slate-300">
        {t("Type every country you can think of before time runs out. English, French or Portuguese names all count!")}
      </p>
      <div>
        <div className="mb-2 text-sm font-bold text-slate-300 uppercase">{t("Where")}</div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <Chip
              key={s}
              active={scope === s}
              onClick={() => {
                setScope(s);
                setMinutes(TIMES[s === "World" ? "world" : "region"][1]);
              }}
            >
              {SCOPE_EMOJI[s]} {t(s)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-slate-300 uppercase">{t("Time")}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((m) => (
            <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
              {m ? t("{n} min", { n: m }) : t("No timer")}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <GameButton tone="go" className="text-lg" onClick={() => setRound(1)}>
          {t("▶ Play!")}
        </GameButton>
        <span className="text-sm text-slate-400">{t("{n} countries to find", { n: total })}</span>
        {best ? <span className="text-sm text-amber-300">{t("⭐ Your best here: {n}", { n: best })}</span> : null}
      </div>
    </Panel>
  );
}

function formatTime(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function NameAllGame({ scope, minutes, onAgain, onHome }: { scope: Scope; minutes: number; onAgain: () => void; onHome: () => void }) {
  const { t, name, num } = useI18n();
  const profile = useProfile();
  const targets = useMemo(() => QUIZ_COUNTRIES.filter((c) => inScope(c, scope)), [scope]);
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const [found, setFound] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<Rewards | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foundRef = useRef<string[]>([]);
  const finished = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const limit = minutes * 60_000;
  const elapsed = now - start;
  const done = result !== null;
  const remaining = targets.filter((c) => !found.includes(c.code));

  const finish = useCallback(
    (codes: string[]) => {
      if (!profile || finished.current) return;
      finished.current = true;
      if (pending.current) clearTimeout(pending.current);
      const out = applyNameAll(profile, { scope, minutes, found: codes });
      setProfile(out.profile);
      setResult(out.rewards);
      play(out.rewards.leveledUp ? "levelup" : "win");
      window.scrollTo({ top: 0 });
    },
    [profile, scope, minutes],
  );

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (limit && t - start >= limit) finish(foundRef.current);
    }, 250);
    return () => clearInterval(id);
  }, [done, limit, start, finish]);

  useEffect(() => () => {
    if (pending.current) clearTimeout(pending.current);
  }, []);

  const accept = (c: Country) => {
    if (finished.current || foundRef.current.includes(c.code)) return;
    const next = [c.code, ...foundRef.current];
    foundRef.current = next;
    setFound(next);
    setInput("");
    setNote(null);
    play("correct");
    if (next.length === targets.length) finish(next);
  };

  const check = (text: string, force: boolean) => {
    if (pending.current) clearTimeout(pending.current);
    const matches = findExact(text).filter((c) => inScope(c, scope) && c.independent);
    const fresh = matches.find((c) => !found.includes(c.code));
    if (!fresh) {
      setNote(matches.length ? t("Already got {name}!", { name: name(matches[0]) }) : null);
      return;
    }
    // "Niger" is also the start of "Nigeria": wait a moment in case they're still typing.
    const key = normalizeName(text);
    const longer = remaining.some((c) => c.code !== fresh.code && aliasKeys(c).some((k) => k.startsWith(key) && k !== key));
    if (force || !longer) accept(fresh);
    else pending.current = setTimeout(() => accept(fresh), 900);
  };

  const colors = useMemo(() => {
    const out: Record<string, string> = {};
    if (done) for (const c of targets) out[c.code] = MAP_COLORS.wrong;
    for (const code of found) out[code] = MAP_COLORS.correct;
    return out;
  }, [done, targets, found]);

  const missed = done ? targets.filter((c) => !found.includes(c.code)).sort((a, b) => name(a).localeCompare(name(b))) : [];
  const pct = found.length / targets.length;

  return (
    <div className="flex flex-col gap-3">
      {done && pct >= 0.5 && <Confetti seed={found.length} />}
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <span className="font-bold text-violet-300">
          ⌨️ {SCOPE_EMOJI[scope]} {t(scope)}
        </span>
        <span className="text-2xl font-black text-white tabular-nums">
          {found.length}
          <span className="text-base text-slate-400"> / {targets.length}</span>
        </span>
        <span className={cn("ml-auto flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums", limit && limit - elapsed < 30_000 && !done ? "animate-pulse text-red-400" : "text-white")}>
          <Clock className="size-5" />
          {limit ? formatTime(limit - elapsed) : formatTime(elapsed)}
        </span>
        {!done && (
          <GameButton tone="ghost" className="py-1.5 text-sm" onClick={() => finish(foundRef.current)}>
            <FlagIcon className="size-4" /> {t("Give up")}
          </GameButton>
        )}
        <ProgressBar value={pct} className="basis-full" barClassName="from-emerald-400 to-green-600" />
      </Panel>

      {done ? (
        <Panel className="atlas-pop flex flex-col items-center gap-3 text-center">
          <p className="text-3xl font-black text-white">
            {found.length === targets.length ? t("🌍 You named them ALL!") : t("You named {n} of {total}!", { n: found.length, total: targets.length })}
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">+{result.xp} XP</span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">+{result.coins} 🪙</span>
            {result.newBest && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">{t("⭐ New personal best!")}</span>}
            {result.leveledUp && <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-200">{t("⬆️ Level up!")}</span>}
            {result.newBadges.map((b) => (
              <span key={b.id} className="rounded-full bg-violet-500/25 px-3 py-1 text-violet-100">
                {b.emoji} {t(b.name)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <GameButton tone="go" onClick={onAgain}>
              {t("🔁 Play again")}
            </GameButton>
            <GameButton tone="ghost" onClick={onHome}>
              {t("🏠 Menu")}
            </GameButton>
          </div>
        </Panel>
      ) : (
        <Panel className="flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check(input, true);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                check(e.target.value, false);
              }}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={t("Type a country…")}
              aria-label={t("Type a country…")}
              className="w-full rounded-xl bg-slate-800 px-4 py-3 text-xl font-bold text-white ring-2 ring-violet-400/50 outline-none placeholder:font-normal placeholder:text-slate-500 focus:ring-violet-400"
            />
          </form>
          <p className="min-h-5 text-sm text-slate-400">{note ?? t("Countries are accepted as soon as you type them. No need to press Enter.")}</p>
        </Panel>
      )}

      {scope === "World" && (
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {CONTINENTS.map((r) => {
            const all = targets.filter((c) => c.region === r);
            const got = all.filter((c) => found.includes(c.code)).length;
            return (
              <Panel key={r} className="p-2">
                <div className="text-lg">{SCOPE_EMOJI[r]}</div>
                <div className="font-bold text-white tabular-nums">
                  {got}/{all.length}
                </div>
                <div className="truncate text-slate-400">{t(r)}</div>
              </Panel>
            );
          })}
        </div>
      )}

      <WorldMap scope={scope} colors={colors} showNames={done} />

      {done && missed.length > 0 && (
        <Panel>
          <h3 className="mb-2 font-bold text-white">{t("Missed ({n}): learn these for next time", { n: missed.length })}</h3>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {missed.map((c) => (
              <li key={c.code} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-sm">
                <Flag country={c} className="h-4 rounded-sm" />
                <span className="truncate text-white">{name(c)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {found.length > 0 && (
        <Panel>
          <h3 className="mb-2 font-bold text-white">{t("Found ({n})", { n: num(found.length) })}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {found.map((code, i) => {
              const c = targets.find((x) => x.code === code);
              if (!c) return null;
              return (
                <li key={code} className={cn("flex items-center gap-1.5 rounded-full bg-green-500/15 py-1 pr-3 pl-1.5 text-sm text-white", i === 0 && !done && "atlas-pop")}>
                  <Flag country={c} className="h-4 rounded-sm" />
                  {name(c)}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
