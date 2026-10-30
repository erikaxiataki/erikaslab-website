"use client";

import { ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { play } from "@/lib/atlas/sound";
import { SECTION_BY_ID, type SectionId, booksIn } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import { cn } from "@/lib/utils";
import { GameButton, Panel, Selah } from "./ui";

const BEAT_MS = 650;

/**
 * Meet the books of one island: a card per book, then a chant that lights up each name on the beat.
 * On the second time through, some names hide so the player says them from memory.
 */
export function Learn({ island, onDone }: { island: SectionId; onDone: () => void }) {
  const { t, book: name, summary, section: sectionName } = useI18n();
  const sec = SECTION_BY_ID.get(island)!;
  const [books] = useState(() => booksIn(island));
  const [i, setI] = useState(0);
  const [beat, setBeat] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const atEnd = i === books.length;
  const b = books[Math.min(i, books.length - 1)];

  // The chant: one book per beat, twice; round 2 hides every other name.
  useEffect(() => {
    if (beat === null) return;
    if (beat >= books.length * 2) {
      const id = setTimeout(() => {
        setBeat(null);
        setRound((r) => r + 1);
        play("win");
      }, BEAT_MS);
      return () => clearTimeout(id);
    }
    play(beat % books.length === 0 ? "click" : "tick");
    const id = setTimeout(() => setBeat(beat + 1), BEAT_MS);
    return () => clearTimeout(id);
  }, [beat, books.length]);

  const go = (d: number) => {
    play("click");
    setI((x) => Math.max(0, Math.min(books.length, x + d)));
  };

  if (atEnd) {
    const lit = beat === null ? -1 : beat % books.length;
    const hide = beat !== null && beat >= books.length;
    return (
      <div className="flex flex-col gap-4">
        <Panel className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-black text-white">
            {sec.emoji} {t("Chant time! Say each name out loud as it lights up.")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {books.map((x, k) => (
              <span
                key={x.id}
                className={cn("rounded-xl px-3 py-2 text-lg font-black transition", k === lit ? "scale-110 text-stone-950" : "bg-stone-800 text-white")}
                style={k === lit ? { background: sec.color } : undefined}
              >
                {hide && k % 2 === 1 ? (k === lit ? "🎤 ?" : "?") : name(x)}
              </span>
            ))}
          </div>
          {beat !== null && beat >= books.length && <p className="text-sm text-amber-200">{t("Now from memory: fill in the hidden names!")}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            {beat === null ? (
              <GameButton tone="sky" onClick={() => setBeat(0)}>
                <Play className="size-4" /> {round ? t("Chant again") : t("Start the chant")}
              </GameButton>
            ) : (
              <GameButton tone="ghost" onClick={() => setBeat(null)}>
                <Square className="size-4" /> {t("Stop")}
              </GameButton>
            )}
            <GameButton tone="go" onClick={onDone}>
              {t("✅ I've met them all!")}
            </GameButton>
          </div>
        </Panel>
        <GameButton tone="ghost" className="self-start" onClick={() => go(-1)}>
          <ChevronLeft className="size-4" /> {t("Back to the cards")}
        </GameButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-1">
        {books.map((x, k) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setI(k)}
            aria-label={name(x)}
            className={cn("h-2.5 rounded-full transition-all", k === i ? "w-8" : "w-2.5 opacity-40")}
            style={{ background: sec.color }}
          />
        ))}
      </div>
      <Panel key={b.id} className="bible-pop mx-auto flex w-full max-w-md flex-col items-center gap-3 py-8 text-center" style={{ boxShadow: `inset 0 8px 0 ${sec.color}` }}>
        <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          {sec.emoji} {sectionName(sec)} · {t("{n} of {total}", { n: i + 1, total: books.length })}
        </span>
        <span className="text-7xl">{b.emoji}</span>
        <span className="text-4xl font-black text-white">{name(b)}</span>
        <span className="flex gap-3 text-sm text-stone-300">
          <span>📖 {t("Book #{n}", { n: b.order })}</span>
          <span>📄 {t("{n} chapters", { n: b.chapters })}</span>
        </span>
        <p className="max-w-sm text-lg text-amber-50">{summary(b)}</p>
        {i > 0 && (
          <p className="text-sm text-stone-400">
            {t("Comes right after {book}.", { book: name(books[i - 1]) })}
          </p>
        )}
      </Panel>
      <div className="flex justify-center gap-3">
        <GameButton tone="ghost" onClick={() => go(-1)} disabled={i === 0} aria-label={t("Previous")}>
          <ChevronLeft className="size-5" />
        </GameButton>
        <GameButton tone="primary" onClick={() => go(1)}>
          {i === books.length - 1 ? t("🎵 To the chant!") : t("Next book")} <ChevronRight className="size-5" />
        </GameButton>
      </div>
      {i === 0 && (
        <Selah>
          {t("Welcome to {section}! There are {n} books here. Let's meet them one by one.", { section: sectionName(sec), n: books.length })}
        </Selah>
      )}
    </div>
  );
}
