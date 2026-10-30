"use client";

import { Lock } from "lucide-react";
import { SECTIONS, type SectionId, booksIn } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import { islandOpen, questDone } from "@/lib/bible/progress";
import { useProfile } from "@/lib/bible/store";
import { cn } from "@/lib/utils";
import { SectionTitle, Selah, Stars } from "./ui";

export type QuestStep = "learn" | "practice" | "boss";

const PLACES: Record<SectionId, string> = {
  law: "🏜️",
  history: "🏰",
  poetry: "🌺",
  major: "⛰️",
  minor: "🏘️",
  gospels: "🌊",
  paul: "📮",
  general: "🌈",
};

/** The Quest Map: one island per section. Meet the books, practice, then beat the boss shelf to open the next island. */
export function QuestMap({ onStep, onGrand }: { onStep: (island: SectionId, step: QuestStep) => void; onGrand: () => void }) {
  const profile = useProfile();
  const { t, section: sectionName } = useI18n();
  if (!profile) return null;
  const allDone = questDone(profile);
  const current = SECTIONS.find((s) => islandOpen(profile, s.id) && !(profile.quest[s.id]?.stars ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <SectionTitle>🗺️ {t("Quest Map")}</SectionTitle>
        <p className="mt-1 text-stone-400">{t("Sail from island to island. Every island holds one part of the Bible.")}</p>
      </div>
      {current && (
        <Selah>
          {current.id === "law" && !profile.quest.law?.learn
            ? t("Hoo-hoo! I'm Selah. Let's start with the very first books of the Bible!")
            : t("Next stop: {island}! You can do it.", { island: sectionName(current) })}
        </Selah>
      )}
      <ol className="relative flex flex-col gap-3 before:absolute before:inset-y-4 before:left-1/2 before:border-l-4 before:border-dotted before:border-amber-200/20">
        {SECTIONS.map((s, i) => {
          const open = islandOpen(profile, s.id);
          const q = profile.quest[s.id];
          const steps: { id: QuestStep; label: string; done: boolean }[] = [
            { id: "learn", label: "👀 Meet", done: !!q?.learn },
            { id: "practice", label: "🎯 Practice", done: !!q?.practice },
            { id: "boss", label: "📚 Boss shelf", done: (q?.stars ?? 0) > 0 },
          ];
          return (
            <li
              key={s.id}
              className={cn(
                "relative w-full rounded-3xl bg-stone-900/90 p-4 ring-2 sm:w-[70%]",
                i % 2 ? "sm:self-end" : "sm:self-start",
                current?.id === s.id ? "ring-amber-300" : "ring-white/10",
                !open && "opacity-60",
              )}
              style={{ boxShadow: open ? `inset 0 -6px 0 ${s.color}` : undefined }}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: `${s.color}33` }}>
                  {open ? PLACES[s.id] : <Lock className="size-6 text-stone-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-widest text-stone-400 uppercase">{t("Island {n}", { n: i + 1 })}</p>
                  <p className="text-lg leading-tight font-black text-white">
                    {s.emoji} {sectionName(s)}
                  </p>
                  <p className="text-sm text-stone-400">{t("{n} books", { n: booksIn(s.id).length })}</p>
                </div>
                <Stars n={q?.stars ?? 0} />
              </div>
              {open ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {steps.map((st, k) => {
                    // Steps go in order the first time; once done, any step can be replayed.
                    const ready = k === 0 || steps[k - 1].done || st.done;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={!ready}
                        onClick={() => onStep(s.id, st.id)}
                        className={cn(
                          "rounded-xl px-2 py-2 text-sm font-bold ring-1 transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40",
                          st.done ? "bg-emerald-600/30 text-emerald-100 ring-emerald-400/40" : ready ? "bible-glow bg-amber-400 text-stone-950 ring-amber-200" : "bg-stone-800 text-stone-300 ring-white/10",
                        )}
                      >
                        {st.done && "✓ "}
                        {t(st.label)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-400">{t("🔒 Finish the island before this one to sail here.")}</p>
              )}
            </li>
          );
        })}
        <li className={cn("relative w-full self-center rounded-3xl p-5 text-center ring-2 sm:w-[80%]", allDone ? "bg-gradient-to-br from-amber-500/30 to-fuchsia-600/20 ring-amber-300" : "bg-stone-900/90 opacity-60 ring-white/10")}>
          <p className="text-4xl">🏛️</p>
          <p className="text-xl font-black text-white">{t("The Great Library")}</p>
          <p className="text-sm text-stone-300">{t("The final challenge: put all 66 books back on the shelf, from Genesis to Revelation.")}</p>
          {allDone ? (
            <button type="button" onClick={onGrand} className="bible-glow mt-3 rounded-xl bg-amber-400 px-4 py-2 font-black text-stone-950">
              {profile.grandDone ? t("🏆 Play again") : t("⚔️ Take the challenge")}
            </button>
          ) : (
            <p className="mt-2 text-sm text-stone-400">{t("🔒 Finish all 8 islands to open it.")}</p>
          )}
        </li>
      </ol>
    </div>
  );
}
