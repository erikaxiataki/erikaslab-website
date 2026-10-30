"use client";

import { Download, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bookshelf, type ShelfResult } from "@/components/bible/Bookshelf";
import { Learn } from "@/components/bible/Learn";
import { Library } from "@/components/bible/Library";
import { ProfileScreen } from "@/components/bible/ProfileScreen";
import { type QuestStep, QuestMap } from "@/components/bible/QuestMap";
import { type QuizConfig, QuizGame } from "@/components/bible/Quiz";
import { Results } from "@/components/bible/Results";
import { Welcome } from "@/components/bible/Welcome";
import { TypeAll, type TypeResult } from "@/components/bible/TypeAll";
import { Chip, GameButton, Panel, ProgressBar, SectionTitle } from "@/components/bible/ui";
import { play } from "@/lib/bible/sound";
import { BOOKS, type Book, SCOPES, SECTIONS, SECTION_BY_ID, type Scope, type SectionId, booksIn } from "@/lib/bible/books";
import { DIFFICULTY, type Difficulty, MODES, type Mode, dailySeed, randomSeed } from "@/lib/bible/game";
import { LANGS, useI18n } from "@/lib/bible/i18n";
import {
  PRACTICE_PASS,
  type Rewards,
  type RoundResult,
  applyRound,
  applyShelf,
  applyTypeAll,
  bestKey,
  islandDone,
  levelFromXp,
  markLearned,
  masteredCount,
  rankFor,
} from "@/lib/bible/progress";
import { getProfile, setProfile, useProfile } from "@/lib/bible/store";
import { cn } from "@/lib/utils";

type ShelfConfig = { books: Book[]; title: string; island?: SectionId; grand?: boolean; scope?: Scope; difficulty?: Difficulty };

type InstallPrompt = Event & { prompt: () => Promise<void> };

type Screen =
  | { name: "welcome" }
  | { name: "home" }
  | { name: "quest" }
  | { name: "learn"; island: SectionId }
  | { name: "setup"; game: "quiz" | "shelf" | "type"; survival?: boolean }
  | { name: "quiz"; config: QuizConfig; label: string }
  | { name: "shelf"; config: ShelfConfig }
  | { name: "type"; scope: Scope }
  | { name: "result"; node: React.ReactNode }
  | { name: "library" }
  | { name: "profile" };

const today = () => new Date().toISOString().slice(0, 10);

function dailyConfig(): QuizConfig {
  return { mode: "mix", scope: "all", difficulty: "normal", seed: dailySeed(), count: 10, daily: true };
}

/** A run of consecutive books from the scope (scopes are contiguous), sized by difficulty. */
function shelfRun(scope: Scope, difficulty: Difficulty) {
  const books = booksIn(scope);
  const n = Math.min(books.length, DIFFICULTY[difficulty].shelf);
  const start = Math.floor(Math.random() * (books.length - n + 1));
  return books.slice(start, start + n);
}

export function BibleGame() {
  const profile = useProfile();
  const { t, lang, num, section: sectionName } = useI18n();
  // Every visit starts on the landing page, where the player picks a language.
  const [screen, setScreen] = useState<Screen>({ name: "welcome" });
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [settings, setSettings] = useState<{ mode: Mode; scope: Scope; difficulty: Difficulty }>({ mode: "next", scope: "law", difficulty: "easy" });

  // Offline support: Bible Quest's own service worker caches the game after the first visit.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/bible-sw.js", { scope: "/bible", updateViaCache: "none" }).catch(() => {});
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
  }, []);

  const showResult = (node: React.ReactNode, rewards: Rewards, win = true) => {
    play(rewards.leveledUp ? "levelup" : win ? "win" : "click");
    setScreen({ name: "result", node });
    window.scrollTo({ top: 0 });
  };

  const scopeLabel = (s: Scope) =>
    s === "all" ? t("📖 Whole Bible") : s === "OT" ? t("📜 Old Testament") : s === "NT" ? t("✝️ New Testament") : `${SECTION_BY_ID.get(s)!.emoji} ${sectionName(SECTION_BY_ID.get(s)!)}`;

  const startQuiz = (config: QuizConfig, label: string) => go({ name: "quiz", config, label });

  const finishQuiz = (config: QuizConfig, label: string) => (r: RoundResult) => {
    const out = applyRound(getProfile(), r);
    setProfile(out.profile);
    const correct = r.answers.filter((a) => a.correct).length;
    const missed = r.answers.flatMap((a, i) => (a.correct ? [] : [r.questions[i].book.id]));
    const passed = !config.island || correct >= r.answers.length * PRACTICE_PASS;
    const toMap = () => go({ name: "quest" });
    showResult(
      <Results
        headline={config.island ? (passed ? t("Practice passed! 🎯") : t("Almost there!")) : t("{n} pts", { n: r.score })}
        sub={
          config.island && !passed
            ? t("Get {k} of {n} right to pass. Try again!", { k: Math.ceil(r.answers.length * PRACTICE_PASS), n: r.answers.length })
            : t("{c} of {n} right · best streak {s}", { c: correct, n: r.answers.length, s: r.bestStreak })
        }
        rewards={out.rewards}
        missed={missed}
        passed={passed}
        onAgain={() => startQuiz({ ...config, seed: config.daily ? config.seed : randomSeed() }, label)}
        onHome={config.island ? toMap : () => go({ name: "home" })}
        homeLabel={config.island ? t("🗺️ Back to the map") : undefined}
      />,
      out.rewards,
      passed,
    );
  };

  const finishShelf = (config: ShelfConfig) => (r: ShelfResult) => {
    const out = applyShelf(getProfile(), { ...r, island: config.island, grand: config.grand });
    setProfile(out.profile);
    const again = () => go({ name: "shelf", config: config.scope && config.difficulty ? { ...config, books: shelfRun(config.scope, config.difficulty) } : config });
    const time = `${Math.floor(r.seconds / 60)}:${String(r.seconds % 60).padStart(2, "0")}`;
    showResult(
      <Results
        headline={config.grand ? t("The Great Library is restored! 🏛️") : config.island ? t("Island complete! 🏝️") : t("Shelf complete! 📚")}
        sub={t("{n} books · {m} mistakes · {time}", { n: r.bookIds.length, m: r.mistakes, time })}
        stars={out.stars}
        rewards={out.rewards}
        onAgain={again}
        onHome={config.island || config.grand ? () => go({ name: "quest" }) : () => go({ name: "home" })}
        homeLabel={config.island || config.grand ? t("🗺️ Back to the map") : undefined}
      />,
      out.rewards,
    );
  };

  const finishType = (r: TypeResult) => {
    const out = applyTypeAll(getProfile(), r);
    setProfile(out.profile);
    const time = `${Math.floor(r.seconds / 60)}:${String(r.seconds % 60).padStart(2, "0")}`;
    showResult(
      <Results
        headline={r.complete ? t("All in order! ⌨️") : t("{n} books typed", { n: r.typed.length })}
        sub={r.complete ? t("Time: {time}", { time }) : t("{n} of {total} in order", { n: r.typed.length, total: booksIn(r.scope).length })}
        rewards={out.rewards}
        passed={r.complete}
        onAgain={() => go({ name: "type", scope: r.scope })}
        onHome={() => go({ name: "home" })}
      />,
      out.rewards,
      r.complete,
    );
  };

  const questStep = (island: SectionId, step: QuestStep) => {
    const sec = SECTION_BY_ID.get(island)!;
    const label = `${sec.emoji} ${sectionName(sec)}`;
    if (step === "learn") go({ name: "learn", island });
    else if (step === "practice") startQuiz({ mode: "mix", scope: island, difficulty: "easy", seed: randomSeed(), count: 8, island }, label);
    else go({ name: "shelf", config: { books: booksIn(island), title: `${label} · ${t("Boss shelf")}`, island } });
  };

  if (screen.name === "welcome") {
    return (
      <Welcome
        profile={profile}
        onStart={(l) => {
          setProfile((p) => ({ ...p, lang: l, langChosen: true }));
          go({ name: "home" });
        }}
      />
    );
  }

  if (!profile) {
    return <div className="grid min-h-[60vh] place-items-center text-stone-400">📖</div>;
  }

  const { level, into, need } = levelFromXp(profile.xp);
  const rank = rankFor(level);

  let body: React.ReactNode;
  switch (screen.name) {
    case "home":
      body = <Home onGo={go} onDaily={() => startQuiz(dailyConfig(), t("📅 Daily"))} onOldNew={() => startQuiz({ mode: "testament", scope: "all", difficulty: "normal", seed: randomSeed(), count: 0, survival: true }, t("⚡ Old or New?"))} />;
      break;
    case "quest":
      body = (
        <QuestMap
          onStep={questStep}
          onGrand={() => go({ name: "shelf", config: { books: BOOKS, title: `🏛️ ${t("The Great Library")}`, grand: true } })}
        />
      );
      break;
    case "learn":
      body = (
        <Learn
          island={screen.island}
          onDone={() => {
            const out = markLearned(getProfile(), screen.island);
            setProfile(out.profile);
            play("win");
            go({ name: "quest" });
          }}
        />
      );
      break;
    case "setup": {
      const { game, survival } = screen;
      // "Old or New?" needs both testaments; the Section Sorter needs more than one section.
      const modeOk = (m: Mode) => !(m === "testament" && settings.scope !== "all") && !(m === "section" && !["all", "OT", "NT"].includes(settings.scope));
      const mode = game === "quiz" && !modeOk(settings.mode) ? "mix" : settings.mode;
      const best = game === "quiz" ? profile.best[bestKey(mode, settings.scope, settings.difficulty, survival)] : undefined;
      const title = game === "quiz" ? (survival ? `💔 ${t("Survival")}` : `🎯 ${t("Quick Quiz")}`) : game === "shelf" ? `📚 ${t("Bookshelf Builder")}` : `⌨️ ${t("Type Them All")}`;
      const start = () => {
        if (game === "quiz") startQuiz({ mode, scope: settings.scope, difficulty: settings.difficulty, seed: randomSeed(), count: 10, survival }, title);
        else if (game === "shelf") go({ name: "shelf", config: { books: shelfRun(settings.scope, settings.difficulty), title, scope: settings.scope, difficulty: settings.difficulty } });
        else go({ name: "type", scope: settings.scope });
      };
      body = (
        <Panel className="flex flex-col gap-4">
          <SectionTitle>{title}</SectionTitle>
          <p className="text-stone-300">
            {game === "quiz"
              ? survival
                ? t("Keep going until you run out of lives ({n} ❤️). How far can you get?", { n: DIFFICULTY[settings.difficulty].lives })
                : t("10 questions. Answer fast for bonus points and build a streak for x2 and x3!")
              : game === "shelf"
                ? t("Tap the books in the right order to put them back on the shelf.")
                : t("Type every book in order, from memory. Each right name jumps onto the shelf.")}
          </p>
          {game === "quiz" && (
            <Picker label={t("Game")}>
              {MODES.filter((m) => modeOk(m.id)).map((m) => (
                <Chip key={m.id} active={mode === m.id} onClick={() => setSettings((s) => ({ ...s, mode: m.id }))} title={t(m.blurb)}>
                  {m.emoji} {t(m.label)}
                </Chip>
              ))}
            </Picker>
          )}
          <Picker label={t("Books")}>
            {SCOPES.map((s) => (
              <Chip key={s} active={settings.scope === s} onClick={() => setSettings((x) => ({ ...x, scope: s }))}>
                {scopeLabel(s)}
              </Chip>
            ))}
          </Picker>
          {game !== "type" && (
            <Picker label={t("Level")}>
              {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
                <Chip key={d} active={settings.difficulty === d} onClick={() => setSettings((s) => ({ ...s, difficulty: d }))}>
                  {DIFFICULTY[d].emoji} {t(DIFFICULTY[d].label)}
                  {game === "shelf" && ` · ${t("{n} books", { n: Math.min(DIFFICULTY[d].shelf, booksIn(settings.scope).length) })}`}
                </Chip>
              ))}
            </Picker>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <GameButton tone="go" className="text-lg" onClick={start}>
              {t("▶ Play!")}
            </GameButton>
            {best ? <span className="text-sm text-amber-300">{t("⭐ Your best here: {n}", { n: best })}</span> : null}
            {game === "type" && profile.typeBest[settings.scope] ? (
              <span className="text-sm text-amber-300">
                {t("⭐ Your best: {n} books", { n: profile.typeBest[settings.scope] })}
                {profile.typeFastest[settings.scope] ? ` · ⏱️ ${Math.floor(profile.typeFastest[settings.scope] / 60)}:${String(profile.typeFastest[settings.scope] % 60).padStart(2, "0")}` : ""}
              </span>
            ) : null}
          </div>
        </Panel>
      );
      break;
    }
    case "quiz":
      body = <QuizGame key={screen.config.seed} config={screen.config} label={screen.label} onFinish={finishQuiz(screen.config, screen.label)} onQuit={() => go(screen.config.island ? { name: "quest" } : { name: "home" })} />;
      break;
    case "shelf":
      body = (
        <Bookshelf
          key={screen.config.books.map((b) => b.id).join()}
          books={screen.config.books}
          title={screen.config.title}
          onFinish={finishShelf(screen.config)}
          onQuit={() => go(screen.config.island || screen.config.grand ? { name: "quest" } : { name: "home" })}
        />
      );
      break;
    case "type":
      body = <TypeAll key={screen.scope} scope={screen.scope} title={`⌨️ ${scopeLabel(screen.scope)}`} onFinish={finishType} onQuit={() => go({ name: "home" })} />;
      break;
    case "result":
      body = screen.node;
      break;
    case "library":
      body = <Library />;
      break;
    case "profile":
      body = <ProfileScreen />;
      break;
  }

  const playing = screen.name === "quiz" || screen.name === "shelf" || screen.name === "type";

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#140e09]/90 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-b-2xl">
        <button type="button" onClick={() => go({ name: "home" })} className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/bible/icon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
          <span>
            Bible<span className="text-amber-400">Quest</span>
          </span>
        </button>
        <button type="button" onClick={() => go({ name: "profile" })} className="ml-auto flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-stone-800">
          <span className="text-2xl">{rank.emoji}</span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-tight font-bold text-white">{t(rank.title)}</span>
            <span className="block text-xs leading-tight text-amber-300">📚 {masteredCount(profile)} / 66</span>
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
              className={cn("px-1.5 py-1", lang === l.id ? "bg-amber-400 text-stone-950" : "text-stone-400 hover:text-white")}
            >
              {l.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={profile.muted ? t("Unmute sounds") : t("Mute sounds")}
          onClick={() => setProfile((p) => ({ ...p, muted: !p.muted }))}
          className="rounded-lg p-1.5 text-stone-300 hover:bg-stone-800"
        >
          {profile.muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        {install && (
          <button
            type="button"
            onClick={() => install.prompt().finally(() => setInstall(null))}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-1 text-xs font-bold text-amber-200 hover:bg-amber-400/30"
          >
            <Download className="size-4" /> {t("Install")}
          </button>
        )}
      </header>
      {screen.name !== "home" && !playing && (
        <button type="button" onClick={() => go({ name: "home" })} className="self-start text-sm font-semibold text-stone-400 hover:text-white">
          ← {t("Menu")}
        </button>
      )}
      {body}
    </div>
  );
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Home({ onGo, onDaily, onOldNew }: { onGo: (s: Screen) => void; onDaily: () => void; onOldNew: () => void }) {
  const profile = useProfile()!;
  const { t } = useI18n();
  const islands = SECTIONS.filter((s) => islandDone(profile, s.id)).length;
  const dailyDone = profile.dailyLast === today();
  const tiles: { emoji: string; title: string; text: string; onClick: () => void; className: string; badge?: string }[] = [
    {
      emoji: "🗺️",
      title: "Quest Map",
      text: "Sail to 8 islands with Selah the owl. Meet the books, practice, and beat each boss shelf!",
      onClick: () => onGo({ name: "quest" }),
      className: "from-amber-500/35 to-orange-700/20 ring-amber-400/50 sm:col-span-2",
      badge: t("🏝️ {n} / 8 islands", { n: islands }),
    },
    {
      emoji: "📅",
      title: "Daily Challenge",
      text: dailyDone ? "Done today! Come back tomorrow, or replay for fun." : "10 new questions every day. Same for everyone!",
      onClick: onDaily,
      className: "from-rose-500/30 to-pink-700/20 ring-rose-400/40",
      badge: profile.dailyStreak ? t("🔥 {n}-day streak", { n: profile.dailyStreak }) : t("+25 🪙 bonus"),
    },
    { emoji: "📚", title: "Bookshelf Builder", text: "Tap the books in order to rebuild the shelf.", onClick: () => onGo({ name: "setup", game: "shelf" }), className: "from-emerald-500/30 to-teal-700/20 ring-emerald-400/40" },
    { emoji: "🎯", title: "Quick Quiz", text: "What comes next? Missing book? Which book? 10 questions.", onClick: () => onGo({ name: "setup", game: "quiz" }), className: "from-sky-500/30 to-indigo-700/20 ring-sky-400/40" },
    { emoji: "⚡", title: "Old or New?", text: "Old Testament or New? As fast as you can. 3 lives!", onClick: onOldNew, className: "from-yellow-500/30 to-amber-700/20 ring-yellow-400/40" },
    { emoji: "⌨️", title: "Type Them All", text: "Type all the books in order, from memory.", onClick: () => onGo({ name: "setup", game: "type" }), className: "from-teal-500/30 to-cyan-700/20 ring-teal-400/40" },
    { emoji: "💔", title: "Survival", text: "Endless questions. Lose your lives and it's over.", onClick: () => onGo({ name: "setup", game: "quiz", survival: true }), className: "from-red-500/30 to-rose-800/20 ring-red-400/40" },
    {
      emoji: "🏛️",
      title: "The Great Library",
      text: "See every book you've brought back, and read its story card.",
      onClick: () => onGo({ name: "library" }),
      className: "from-violet-500/30 to-fuchsia-700/20 ring-violet-400/40",
      badge: `📚 ${masteredCount(profile)} / 66`,
    },
    { emoji: "🏅", title: "Badges & Stats", text: "Your level, badges, streak shields and save code.", onClick: () => onGo({ name: "profile" }), className: "from-stone-500/30 to-stone-700/20 ring-stone-400/40" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="py-2 text-center sm:py-4">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t("Learn the")} <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">{t("66 books")}</span>!
        </h1>
        <p className="mt-2 text-stone-400">{t("From Genesis to Revelation: learn their order, their sections and their stories. Earn XP, coins and badges.")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <button
            key={tile.title}
            type="button"
            onClick={tile.onClick}
            className={cn("group relative flex items-start gap-3 rounded-2xl bg-gradient-to-br p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:brightness-125", tile.className)}
          >
            <span className="text-4xl transition group-hover:scale-110">{tile.emoji}</span>
            <span className={tile.badge ? "pr-20 sm:pr-0" : undefined}>
              <span className="block text-lg font-black text-white">{t(tile.title)}</span>
              <span className="block text-sm text-stone-300">{t(tile.text)}</span>
            </span>
            {tile.badge && <span className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">{tile.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
