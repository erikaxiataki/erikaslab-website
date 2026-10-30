"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { play } from "@/lib/atlas/sound";
import { type Book, sectionOf } from "@/lib/bible/books";
import { mulberry32, randomSeed, shuffle } from "@/lib/bible/game";
import { useI18n } from "@/lib/bible/i18n";
import { cn } from "@/lib/utils";
import { BookTile, Confetti, Panel, Selah, Spine } from "./ui";

export type ShelfResult = { bookIds: string[]; mistakes: number; seconds: number };

/** Long shelves are built one section at a time, so the pile never gets overwhelming. */
const CHUNK_OVER = 13;

export const spineHeight = (b: Book) => 92 + Math.min(36, Math.round(b.chapters / 1.5));

/**
 * Bookshelf Builder: tap the books from the pile in Bible order to put them back on the shelf.
 * Two misses in a row and Selah points at the right one.
 */
export function Bookshelf({ books, title, onFinish, onQuit }: { books: Book[]; title: string; onFinish: (r: ShelfResult) => void; onQuit: () => void }) {
  const { t, book: name, section: sectionName } = useI18n();
  const [seed] = useState(randomSeed);
  const order = useMemo(() => shuffle(books, mulberry32(seed)), [books, seed]);
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [missRun, setMissRun] = useState(0);
  const [wrongId, setWrongId] = useState<{ id: string; n: number } | null>(null);
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const done = placed === books.length;
  const nextBook = books[placed];
  const chunked = books.length > CHUNK_OVER;
  const pile = order.filter((b) => b.order >= (nextBook?.order ?? Infinity) && (!chunked || b.section === nextBook.section));

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [done]);

  const seconds = Math.round((now - start) / 1000);

  useEffect(() => {
    if (!done) return;
    play("win");
    const id = setTimeout(() => onFinish({ bookIds: books.map((b) => b.id), mistakes, seconds: Math.round((Date.now() - start) / 1000) }), 1800);
    return () => clearTimeout(id);
  }, [done, books, mistakes, start, onFinish]);

  const tap = (b: Book) => {
    if (done) return;
    if (b.id === nextBook.id) {
      play("correct");
      setPlaced((n) => n + 1);
      setMissRun(0);
      setWrongId(null);
    } else {
      play("wrong");
      setMistakes((m) => m + 1);
      setMissRun((m) => m + 1);
      setWrongId((w) => ({ id: b.id, n: (w?.n ?? 0) + 1 }));
    }
  };

  const wrongBook = wrongId ? books.find((b) => b.id === wrongId.id) : undefined;
  const sec = nextBook ? sectionOf(nextBook) : null;

  return (
    <div className="flex flex-col gap-3">
      {done && <Confetti />}
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <button type="button" onClick={onQuit} aria-label={t("Quit game")} className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white">
          <X className="size-5" />
        </button>
        <span className="font-bold text-amber-300">{title}</span>
        <span className="ml-auto text-sm text-stone-300 tabular-nums">
          📚 {placed} / {books.length}
        </span>
        <span className="text-sm text-stone-300 tabular-nums">⏱️ {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
        <span className={cn("text-sm tabular-nums", mistakes ? "text-red-300" : "text-stone-300")}>❌ {mistakes}</span>
      </Panel>

      {/* The shelf */}
      <Panel className="bg-gradient-to-b from-amber-950/60 to-stone-900/80">
        <div className="flex flex-wrap items-end gap-x-0.5 gap-y-3">
          {books.map((b, i) =>
            i < placed ? (
              <div key={b.id} className="bible-slot border-b-8 border-amber-800">
                <Spine book={b} height={spineHeight(b)} />
              </div>
            ) : (
              <div key={b.id} className="border-b-8 border-amber-800">
                <div
                  className={cn("w-7 rounded-t-md border-2 border-dashed sm:w-8", i === placed ? "animate-pulse border-amber-300 bg-amber-300/10" : "border-white/10")}
                  style={{ height: spineHeight(b) }}
                />
              </div>
            ),
          )}
        </div>
      </Panel>

      {!done && (
        <>
          <Selah mood={missRun >= 2 ? "think" : "happy"}>
            {missRun >= 2
              ? t("Psst! Look for the glowing book.")
              : wrongBook
                ? t("Not yet! {book} comes later. What comes next?", { book: name(wrongBook) })
                : placed === 0
                  ? chunked
                    ? t("Start with {section}. Which book comes first?", { section: `${sec!.emoji} ${sectionName(sec!)}` })
                    : t("Which book comes first?")
                  : chunked && nextBook.section !== books[placed - 1].section
                    ? t("Now {section}! Which book comes first?", { section: `${sec!.emoji} ${sectionName(sec!)}` })
                    : t("What comes after {book}?", { book: name(books[placed - 1]) })}
          </Selah>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {pile.map((b) => (
              <BookTile
                key={wrongId?.id === b.id ? `${b.id}-${wrongId.n}` : b.id}
                book={b}
                onClick={() => tap(b)}
                className={cn("py-3", wrongId?.id === b.id && "bible-shake ring-2 ring-red-400", missRun >= 2 && b.id === nextBook.id && "animate-pulse ring-4 ring-amber-300")}
              />
            ))}
          </div>
        </>
      )}
      {done && (
        <Selah mood="party" className="bible-pop self-center">
          {t("The shelf is complete! 📚")}
        </Selah>
      )}
    </div>
  );
}
