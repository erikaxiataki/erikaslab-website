"use client";

import { Crown, LogOut, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shareLink } from "@/lib/atlas/challenge";
import { type Answer, type Question, generateQuestions, randomSeed, timeLimitMs } from "@/lib/atlas/game";
import {
  type GameSettings,
  MAX_PLAYERS,
  type Player,
  REACTIONS,
  Room,
  type RoomEvent,
  makeRoomCode,
  normalizeRoomCode,
  onlineEnabled,
} from "@/lib/atlas/online";
import { useI18n } from "@/lib/atlas/i18n";
import { PLAYER_COLORS, isSafeInitials, normalizeInitials } from "@/lib/atlas/identity";
import { applyRound } from "@/lib/atlas/progress";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { QuestionView } from "./QuestionView";
import { type Settings, SettingsPicker } from "./SettingsPicker";
import { Confetti, GameButton, Panel, SectionTitle } from "./ui";

const QUESTIONS_PER_GAME = 10;
const REVEAL_MS = 3000;

type AnswerEvt = Extract<RoomEvent, { type: "answer" }>;

export function OnlineRoom({ initialCode, onHome }: { initialCode?: string | null; onHome: () => void }) {
  const [code, setCode] = useState<string | null>(initialCode ? normalizeRoomCode(initialCode) || null : null);
  const [joinInput, setJoinInput] = useState("");
  const profile = useProfile();
  const { t, nick } = useI18n();

  if (!onlineEnabled) {
    return (
      <Panel className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl">🔌</span>
        <SectionTitle>{t("Online rooms aren't set up yet")}</SectionTitle>
        <p className="max-w-md text-slate-400">
          {t("A grown-up needs to connect the free online service first (see SETUP-ONLINE.md). Until then, try a ⚔️ Duel on one device or send a 🎯 challenge link!")}
        </p>
        <GameButton tone="ghost" onClick={onHome}>
          {t("🏠 Menu")}
        </GameButton>
      </Panel>
    );
  }

  if (!profile) return null;

  const hasInitials = isSafeInitials(profile.initials);

  // Friends need initials to recognize each other, so ask for them first (even when arriving with an invite link).
  if (code && !hasInitials) {
    return (
      <Panel className="flex flex-col gap-4">
        <SectionTitle>{t("🌐 Play online with friends")}</SectionTitle>
        <InitialsField />
        <p className="text-sm text-slate-400">{t("Then you'll join room {code}.", { code })}</p>
      </Panel>
    );
  }

  if (!code) {
    const joinCode = normalizeRoomCode(joinInput);
    return (
      <Panel className="flex flex-col gap-5">
        <SectionTitle>{t("🌐 Play online with friends")}</SectionTitle>
        <p className="text-slate-300">
          {t("You'll play as")} <b className="text-white">{profile.avatar} {nick(profile.name)}</b>. {t("Only friends with your room code can join.")}
        </p>
        <InitialsField />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4">
            <p className="font-bold text-white">{t("🏠 Host a game")}</p>
            <p className="text-sm text-slate-400">{t("Get a code and send it to your friends.")}</p>
            <GameButton tone="go" disabled={!hasInitials} onClick={() => setCode(makeRoomCode())}>
              {t("Create room")}
            </GameButton>
          </div>
          <form
            className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.length === 5 && hasInitials) setCode(joinCode);
            }}
          >
            <label htmlFor="room-code" className="font-bold text-white">
              {t("🔑 Join a friend")}
            </label>
            <input
              id="room-code"
              value={joinCode}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="CODE"
              autoComplete="off"
              className="rounded-xl bg-slate-900 px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] text-white uppercase ring-1 ring-white/10 outline-none focus:ring-violet-400"
            />
            <GameButton type="submit" disabled={joinCode.length !== 5 || !hasInitials}>
              {t("Join room")}
            </GameButton>
          </form>
        </div>
        <p className="text-xs text-slate-500">{t("🛡️ Safe mode: no chat, just initials, nicknames and emoji reactions. Rooms vanish when everyone leaves.")}</p>
      </Panel>
    );
  }

  return <RoomView key={code} code={code} onLeave={() => setCode(null)} onHome={onHome} />;
}

type Phase = "lobby" | "countdown" | "playing" | "podium";
type Game = { settings: GameSettings; round: number; questions: Question[]; participants: string[] };

function RoomView({ code, onLeave, onHome }: { code: string; onLeave: () => void; onHome: () => void }) {
  const profile = useProfile();
  const { t, nick, num } = useI18n();
  const [id] = useState(() => crypto.randomUUID());
  const [joinedAt] = useState(() => Date.now());
  const name = profile?.name ?? "";
  const avatar = profile?.avatar ?? "";
  const initials = profile?.initials ?? "";
  const me = useMemo<Player>(() => ({ id, name, avatar, initials, joinedAt }), [id, name, avatar, initials, joinedAt]);

  const roomRef = useRef<Room | null>(null);
  const gameRef = useRef<Game | null>(null);
  const playersRef = useRef<Player[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "full" | "error">("connecting");
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<string, AnswerEvt>>>({});
  const [reactions, setReactions] = useState<{ key: number; id: string; emoji: string }[]>([]);
  const [settings, setSettings] = useState<Settings>({ mode: "mix", scope: "World", difficulty: "normal" });
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    const onEvent = (e: RoomEvent) => {
      const g = gameRef.current;
      switch (e.type) {
        case "start": {
          if (g && e.round <= g.round) return;
          const s = e.settings;
          const next: Game = {
            settings: s,
            round: e.round,
            questions: generateQuestions(s.seed, s.mode, s.scope, s.difficulty, s.count),
            participants: playersRef.current.map((p) => p.id),
          };
          gameRef.current = next;
          setGame(next);
          setQIndex(0);
          setAnswers({});
          setPhase("countdown");
          play("click");
          setTimeout(() => {
            if (gameRef.current?.round === e.round) setPhase((p) => (p === "countdown" ? "playing" : p));
          }, 3000);
          return;
        }
        case "answer":
          if (!g || e.round !== g.round) return;
          setAnswers((prev) => (prev[e.q]?.[e.id] ? prev : { ...prev, [e.q]: { ...prev[e.q], [e.id]: e } }));
          return;
        case "next":
          if (!g || e.round !== g.round) return;
          if (e.q >= g.questions.length) {
            setPhase("podium");
            play("win");
          } else setQIndex((q) => Math.max(q, e.q));
          return;
        case "react": {
          const key = Math.random();
          setReactions((r) => [...r.slice(-12), { key, id: e.id, emoji: e.emoji }]);
          setTimeout(() => setReactions((r) => r.filter((x) => x.key !== key)), 1800);
          return;
        }
      }
    };
    const room = new Room(code, me, {
      onPlayers: (p) => {
        playersRef.current = p;
        setPlayers(p);
      },
      onEvent,
      onStatus: setStatus,
    });
    roomRef.current = room;
    void room.connect();
    return () => {
      roomRef.current = null;
      void room.leave();
    };
  }, [code, me]);

  const isHost = players[0]?.id === me.id;
  const send = useCallback((e: RoomEvent) => roomRef.current?.send(e), []);

  // --- Host duties: move everyone to the next question --------------------------
  const sentNext = useRef<string>("");
  const advance = useCallback(
    (round: number, q: number) => {
      const key = `${round}-${q}`;
      if (sentNext.current === key) return;
      sentNext.current = key;
      send({ type: "next", round, q });
    },
    [send],
  );

  const current = game ? answers[qIndex] ?? {} : {};
  const present = game ? game.participants.filter((pid) => players.some((p) => p.id === pid)) : [];
  const allAnswered = present.length > 0 && present.every((pid) => current[pid]);

  useEffect(() => {
    if (!isHost || phase !== "playing" || !game) return;
    const wait = allAnswered ? REVEAL_MS : timeLimitMs(game.questions[qIndex]?.kind ?? "map", game.settings.difficulty) + REVEAL_MS + 1500;
    const t = setTimeout(() => advance(game.round, qIndex + 1), wait);
    return () => clearTimeout(t);
  }, [isHost, phase, game, qIndex, allAnswered, advance]);

  // --- Scores ---------------------------------------------------------------------
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const q of Object.values(answers)) for (const a of Object.values(q)) t[a.id] = (t[a.id] ?? 0) + a.points;
    return t;
  }, [answers]);

  const myStreak = useMemo(() => {
    let s = 0;
    for (let q = 0; q < qIndex; q++) s = answers[q]?.[me.id]?.correct ? s + 1 : 0;
    return s;
  }, [answers, qIndex, me.id]);

  // Save progress once when a round ends.
  const savedRound = useRef(-1);
  useEffect(() => {
    if (phase !== "podium" || !game || savedRound.current === game.round) return;
    savedRound.current = game.round;
    const mine = game.questions.flatMap((question, q) => {
      const a = answers[q]?.[me.id];
      return a ? [{ question, answer: { correct: a.correct, points: a.points, ms: a.ms } as Answer }] : [];
    });
    const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const won = ranking.length > 1 && ranking[0][0] === me.id && ranking[0][1] > (ranking[1]?.[1] ?? 0);
    let best = 0;
    let s = 0;
    for (const m of mine) {
      s = m.answer.correct ? s + 1 : 0;
      best = Math.max(best, s);
    }
    const { mode, scope, difficulty } = game.settings;
    setProfile(
      (p) =>
        applyRound(
          p,
          {
            mode,
            scope,
            difficulty,
            questions: mine.map((m) => m.question),
            answers: mine.map((m) => m.answer),
            score: totals[me.id] ?? 0,
            bestStreak: best,
          },
          { onlineGames: 1, onlineWins: won ? 1 : 0 },
        ).profile,
    );
  }, [phase, game, answers, totals, me.id]);

  const start = () => {
    const round = (game?.round ?? 0) + 1;
    send({ type: "start", round, settings: { ...settings, seed: randomSeed(), count: QUESTIONS_PER_GAME } });
  };

  const lastReact = useRef(0);
  const react = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastReact.current < 800) return;
      lastReact.current = now;
      send({ type: "react", id: me.id, emoji });
    },
    [send, me.id],
  );

  const shareCode = async () => {
    const how = await shareLink(`${window.location.origin}/atlas?room=${code}`, t("Join my Atlas Quest room! Code: {code} 🌍", { code }));
    setShareMsg(how === "copied" ? t("Invite copied! 📋") : how === "shared" ? t("Invite sent! 🚀") : null);
  };

  if (status === "full" || status === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl">{status === "full" ? "🚪" : "📡"}</span>
        <p className="text-xl font-bold text-white">
          {status === "full" ? t("Room {code} is full (max {n} players).", { code, n: MAX_PLAYERS }) : t("Couldn't connect. Check your internet and try again.")}
        </p>
        <GameButton tone="ghost" onClick={onLeave}>
          {t("⬅ Back")}
        </GameButton>
      </Panel>
    );
  }

  const ranked = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  const question = game?.questions[qIndex];

  const scoreboard = (
    <Panel className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300 uppercase">
          {t("Players")} {players.length}/{MAX_PLAYERS}
        </span>
        {phase === "playing" && game && (
          <span className="text-sm text-slate-400">
            Q {qIndex + 1}/{game.questions.length}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {(game ? ranked : players).map((p, i) => {
          const r = reactions.filter((x) => x.id === p.id).at(-1);
          const answered = phase === "playing" && current[p.id];
          return (
            <li
              key={p.id}
              className={cn("relative flex items-center gap-2 rounded-lg border-l-4 px-2 py-1.5", p.id === me.id ? "bg-violet-500/20" : "bg-slate-800/70")}
              style={{ borderLeftColor: colorOf(players, p.id) }}
            >
              {game && <span className="w-4 text-xs font-black text-slate-400">{i + 1}</span>}
              <InitialsBadge initials={p.initials} color={colorOf(players, p.id)} />
              <span className="text-2xl">{p.avatar}</span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-black text-white">
                  {p.initials || "?"}
                  {p.id === me.id && <span className="text-xs font-semibold text-violet-300"> {t("(you)")}</span>}
                </span>
                <span className="truncate text-xs text-slate-400">{nick(p.name)}</span>
              </span>
              {p.id === players[0]?.id && <Crown className="size-4 shrink-0 text-amber-300" aria-label={t("Host")} />}
              {answered && <span title={t("Answered")}>✔️</span>}
              {game && <span className="ml-auto font-black text-white tabular-nums">{num(totals[p.id] ?? 0)}</span>}
              {r && (
                <span key={r.key} className="atlas-float pointer-events-none absolute -top-2 right-10 text-2xl font-black text-amber-300">
                  {r.emoji}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-1 pt-1">
        {REACTIONS.map((e) => (
          <button key={e} type="button" onClick={() => react(e)} className="rounded-lg bg-slate-800 px-2 py-1 text-lg font-black text-white hover:bg-slate-700">
            {e}
          </button>
        ))}
      </div>
    </Panel>
  );

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-wrap items-center gap-3 py-3">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-800 py-1 pr-3 pl-1 text-sm font-bold text-white" title={t("This is you")}>
          <InitialsBadge initials={me.initials} color={colorOf(players, me.id)} />
          {me.avatar} {t("You")}
        </span>
        <span className="text-sm text-slate-400">{t("Room code")}</span>
        <span className="font-mono text-2xl font-black tracking-[0.3em] text-amber-300">{code}</span>
        <button type="button" onClick={shareCode} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-sm text-slate-200 hover:bg-slate-700">
          <Share2 className="size-4" /> {t("Invite")}
        </button>
        {shareMsg && <span className="text-sm text-emerald-300">{shareMsg}</span>}
        {status === "connecting" && <span className="animate-pulse text-sm text-slate-400">{t("Connecting…")}</span>}
        <button type="button" onClick={onLeave} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
          <LogOut className="size-4" /> {t("Leave")}
        </button>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <div className="order-2 lg:order-1">
          {phase === "lobby" &&
            (isHost ? (
              <Panel className="flex flex-col gap-4">
                <SectionTitle>{t("👑 You're the host")}</SectionTitle>
                <SettingsPicker value={settings} onChange={setSettings} />
                <GameButton tone="go" className="self-start text-lg" onClick={start} disabled={status !== "connected"}>
                  {t("🚀 Start game")}
                  {players.length < 2 && ` ${t("(solo)")}`}
                </GameButton>
                {players.length < 2 && <p className="text-sm text-slate-400">{t("Waiting for friends… press Invite to send them the code.")}</p>}
              </Panel>
            ) : (
              <Panel className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="animate-bounce text-5xl">⏳</span>
                <p className="text-xl font-bold text-white">{t("Waiting for {name} to start…", { name: players[0] ? players[0].initials || nick(players[0].name) : t("the host") })}</p>
                <p className="text-sm text-slate-400">{t("Send some reactions while you wait!")}</p>
              </Panel>
            ))}

          {phase === "countdown" && <Countdown />}

          {phase === "playing" && game && question && (
            <Panel>
              <QuestionView
                key={`${game.round}-${qIndex}`}
                question={question}
                difficulty={game.settings.difficulty}
                scope={game.settings.scope}
                streak={myStreak}
                onAnswer={(a) => send({ type: "answer", id: me.id, round: game.round, q: qIndex, correct: a.correct, points: a.points, ms: a.ms })}
                footer={() => (
                  <p className="animate-pulse text-sm text-slate-300">
                    {allAnswered ? t("Next question coming…") : t("Waiting for others… ({n}/{total})", { n: Object.keys(current).length, total: present.length })}
                  </p>
                )}
              />
            </Panel>
          )}

          {phase === "podium" && (
            <Panel className="flex flex-col items-center gap-4 py-6 text-center">
              <Confetti />
              <SectionTitle>{t("🏁 Final results")}</SectionTitle>
              <div className="flex items-end justify-center gap-3">
                {[1, 0, 2].map((pos) => {
                  const p = ranked[pos];
                  if (!p) return <div key={pos} className="w-24" />;
                  return (
                    <div key={p.id} className="flex w-24 flex-col items-center">
                      <span className="text-4xl">{p.avatar}</span>
                      <InitialsBadge initials={p.initials} color={colorOf(players, p.id)} size="lg" />
                      <span className="w-full truncate text-xs text-slate-400">{nick(p.name)}</span>
                      <span className="text-xs text-slate-300 tabular-nums">{num(totals[p.id] ?? 0)}</span>
                      <div
                        className={cn(
                          "mt-1 grid w-full place-items-center rounded-t-lg text-3xl",
                          pos === 0 ? "h-28 bg-amber-400/80" : pos === 1 ? "h-20 bg-slate-300/70" : "h-14 bg-orange-700/70",
                        )}
                      >
                        {["🥇", "🥈", "🥉"][pos]}
                      </div>
                    </div>
                  );
                })}
              </div>
              {isHost ? (
                <GameButton tone="go" onClick={() => setPhase("lobby")}>
                  {t("🔁 New game")}
                </GameButton>
              ) : (
                <p className="text-slate-400">{t("Waiting for the host to start a new game…")}</p>
              )}
              <GameButton tone="ghost" onClick={onHome}>
                {t("🏠 Menu")}
              </GameButton>
            </Panel>
          )}
        </div>
        <div className="order-1 lg:order-2">{scoreboard}</div>
      </div>
    </div>
  );
}

function Countdown() {
  const { t } = useI18n();
  const [n, setN] = useState(3);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => play(n > 0 ? "tick" : "correct"), [n]);
  return (
    <Panel className="grid place-items-center py-16">
      <span key={n} className="atlas-pop text-8xl font-black text-white">
        {n > 0 ? n : t("GO!")}
      </span>
    </Panel>
  );
}

/** Each player's color: by join order, so it stays the same for everyone in the room. */
function colorOf(players: Player[], id: string) {
  const i = players.findIndex((p) => p.id === id);
  return PLAYER_COLORS[(i < 0 ? 0 : i) % PLAYER_COLORS.length];
}

/** Initials in a colored circle, the main way friends tell each other apart. */
function InitialsBadge({ initials, color, size = "md" }: { initials: string; color: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-black text-slate-950 ring-2 ring-white/30",
        size === "lg" ? "size-12 text-lg" : "size-8 text-xs",
      )}
      style={{ background: color }}
    >
      {initials || "?"}
    </span>
  );
}

/** Lets the player pick the 2–3 letters friends will see in online rooms. */
export function InitialsField() {
  const profile = useProfile();
  const { t } = useI18n();
  const [draft, setDraft] = useState(profile?.initials ?? "");
  const value = normalizeInitials(draft);
  const valid = isSafeInitials(value);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-violet-500/10 p-4 ring-1 ring-violet-400/30">
      <label htmlFor="initials" className="font-bold text-white">
        {t("Your initials")}
      </label>
      <p className="text-sm text-slate-400">{t("2 or 3 letters so your friends know it's you (like JT).")}</p>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{profile?.avatar}</span>
        <InitialsBadge initials={value} color={PLAYER_COLORS[1]} size="lg" />
        <input
          id="initials"
          value={value}
          onChange={(e) => {
            const next = normalizeInitials(e.target.value);
            setDraft(next);
            if (isSafeInitials(next)) setProfile((p) => ({ ...p, initials: next }));
          }}
          maxLength={3}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="AB"
          className="w-28 rounded-xl bg-slate-900 px-3 py-2 text-center font-mono text-2xl font-black tracking-[0.3em] text-white uppercase ring-1 ring-white/10 outline-none focus:ring-violet-400"
        />
      </div>
      {value.length >= 2 && !valid && <p className="text-sm text-red-300">{t("Please choose different letters.")}</p>}
    </div>
  );
}
