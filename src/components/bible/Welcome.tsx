"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { BOOKS, type Lang, SECTIONS, sectionOf } from "@/lib/bible/books";
import { translate } from "@/lib/bible/i18n";
import { islandDone, levelFromXp, masteredCount, type Profile, rankFor } from "@/lib/bible/progress";
import { cn } from "@/lib/utils";
import { SaveRestore } from "./ProfileScreen";

const CHOICES: { lang: Lang; flag: string; label: string; play: string; resume: string; last: string }[] = [
  { lang: "en", flag: "gb", label: "English", play: "Play in English", resume: "Continue in English", last: "Your last choice" },
  { lang: "fr", flag: "fr", label: "Français", play: "Jouer en français", resume: "Continuer en français", last: "Ton dernier choix" },
  { lang: "pt", flag: "br", label: "Português", play: "Jogar em português", resume: "Continuar em português", last: "Sua última escolha" },
];

const FEATURES: { emoji: string; title: string; text: string }[] = [
  { emoji: "🗺️", title: "Quest Map", text: "Sail to 8 islands, one for each part of the Bible." },
  { emoji: "📚", title: "Bookshelf Builder", text: "Put the books back in order, from Genesis to Revelation." },
  { emoji: "🦉", title: "Selah the owl", text: "Hints and cheers, and every mistake becomes a lesson." },
  { emoji: "🏅", title: "XP, badges and streaks", text: "Level up, collect 18 badges and keep your daily streak." },
];

export function isReturning(p: Profile | null) {
  return !!p && (p.gamesPlayed > 0 || p.xp > 0 || Object.keys(p.quest).length > 0);
}

/** The landing page: pick a language first, see your saved progress, or restore a save code. */
export function Welcome({ profile, onStart }: { profile: Profile | null; onStart: (lang: Lang) => void }) {
  const [preview, setPreview] = useState<Lang | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const lang = preview ?? profile?.lang ?? "en";
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const returning = isReturning(profile);
  // A little shelf of spines under the title (every other book, in section colors).
  const spines = BOOKS.filter((_, i) => i % 2 === 0);

  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center sm:gap-10 sm:py-12">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
        <img src="/bible/icon.svg" alt="" width={144} height={144} className="bible-pop size-28 rounded-[30px] shadow-2xl shadow-orange-900/60 sm:size-36" />
        <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl">
          Bible<span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">Quest</span>
        </h1>
        <p className="max-w-xl text-lg text-stone-300 sm:text-xl">
          <span lang="en">Learn the 66 books of the Bible</span>
          <span className="text-stone-500"> · </span>
          <span lang="fr">Apprends les 66 livres de la Bible</span>
          <span className="text-stone-500"> · </span>
          <span lang="pt">Aprenda os 66 livros da Bíblia</span>
        </p>
        <div aria-hidden className="flex h-12 items-end gap-[3px] overflow-hidden">
          {spines.map((b, i) => (
            <span
              key={b.id}
              className="bible-slot w-2 rounded-t-sm sm:w-2.5"
              style={{ height: 22 + ((b.chapters * 7) % 24), background: sectionOf(b).color, animationDelay: `${i * 25}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-4">
        <p className="text-sm font-bold tracking-widest text-amber-200/80 uppercase">
          <span lang="en">Choose your language</span> · <span lang="fr">Choisis ta langue</span> · <span lang="pt">Escolha seu idioma</span>
        </p>
        <div className="grid w-full gap-3 sm:grid-cols-3 sm:gap-4">
          {CHOICES.map((c) => {
            const last = (returning || profile?.langChosen) && profile?.lang === c.lang;
            return (
              <button
                key={c.lang}
                type="button"
                lang={c.lang}
                onClick={() => onStart(c.lang)}
                onMouseEnter={() => setPreview(c.lang)}
                onFocus={() => setPreview(c.lang)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl bg-stone-900/80 px-5 py-4 text-left ring-2 transition hover:-translate-y-1 hover:bg-amber-500/15 hover:ring-amber-400 focus-visible:ring-amber-400 sm:flex-col sm:gap-3 sm:p-6 sm:text-center",
                  last ? "ring-amber-400/70" : "ring-white/10",
                )}
              >
                {last && <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-stone-950 sm:right-auto">{c.last}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element -- local flag SVG */}
                <img src={`/bible/flags/${c.flag}.svg`} alt="" className="h-12 w-auto rounded-lg shadow-lg ring-1 ring-white/20 transition group-hover:scale-110 sm:h-16" />
                <span className="flex flex-col sm:items-center">
                  <span className="text-2xl font-black text-white">{c.label}</span>
                  <span className="text-sm text-stone-400">{returning ? c.resume : c.play}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {returning && profile && <ProgressCard profile={profile} t={t} />}

      <div className="grid w-full max-w-4xl gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl bg-stone-900/60 p-4 ring-1 ring-white/10">
            <span className="text-3xl">{f.emoji}</span>
            <p className="mt-1 font-black text-white">{t(f.title)}</p>
            <p className="text-sm text-stone-400">{t(f.text)}</p>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-2xl flex-col items-center gap-3">
        <p className="text-sm text-stone-400">
          💾 {t("Your progress saves automatically on this device. No account needed.")}
        </p>
        <button
          type="button"
          onClick={() => setShowRestore((v) => !v)}
          aria-expanded={showRestore}
          className="inline-flex items-center gap-1 rounded-full bg-stone-800 px-4 py-2 text-sm font-bold text-amber-200 ring-1 ring-amber-200/20 hover:bg-stone-700"
        >
          📲 {t("Playing on a new device? Restore your save code")}
          <ChevronDown className={cn("size-4 transition", showRestore && "rotate-180")} />
        </button>
        {showRestore && profile && (
          <div className="bible-pop w-full text-left">
            <SaveRestore restoreOnly lang={lang} />
          </div>
        )}
      </div>

      <p className="text-xs text-stone-500">
        {t("66 books · 8 islands · 3 languages · works offline · no ads")}
      </p>
    </div>
  );
}

function ProgressCard({ profile, t }: { profile: Profile; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const { level } = levelFromXp(profile.xp);
  const rank = rankFor(level);
  const islands = SECTIONS.filter((s) => islandDone(profile, s.id)).length;
  const stats: [string, string][] = [
    ["📚", `${masteredCount(profile)} / 66`],
    ["🏝️", `${islands} / 8`],
    ["🏅", `${profile.badges.length}`],
    ["🔥", `${profile.dailyStreak}`],
  ];
  return (
    <div className="bible-pop flex w-full max-w-xl flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-700/10 p-4 ring-1 ring-amber-400/40">
      <p className="font-black text-white">
        {rank.emoji} {t("Welcome back! Your progress is saved.")}
      </p>
      <p className="text-sm text-amber-200">
        {t(rank.title)} · {t("Level {n}", { n: level })}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {stats.map(([e, v]) => (
          <span key={e} className="rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-white tabular-nums">
            {e} {v}
          </span>
        ))}
      </div>
    </div>
  );
}
