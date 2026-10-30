"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { play } from "@/lib/atlas/sound";
import { type Scope, acceptedNames, booksIn, findBook, normalizeName } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import { HINT_COST } from "@/lib/bible/progress";
import { setProfile, useProfile } from "@/lib/bible/store";
import { cn } from "@/lib/utils";
import { GameButton, Panel, ProgressBar, Selah, Spine } from "./ui";
import { spineHeight } from "./Bookshelf";

export type TypeResult = { scope: Scope; typed: string[]; seconds: number; complete: boolean };

/** Type Them All: type every book of the scope, in order. Each right name drops onto the shelf. */
export function TypeAll({ scope, title, onFinish, onQuit }: { scope: Scope; title: string; onFinish: (r: TypeResult) => void; onQuit: () => void }) {
  const { t, book: name } = useI18n();
  const profile = useProfile();
  const [books] = useState(() => booksIn(scope));
  const [count, setCount] = useState(0);
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [letters, setLetters] = useState(0);
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = count === books.length;
  const next = books[count];
  const seconds = Math.round((now - start) / 1000);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (!done) return;
    play("win");
    const id = setTimeout(() => onFinish({ scope, typed: books.map((b) => b.id), seconds: Math.round((Date.now() - start) / 1000), complete: true }), 1500);
    return () => clearTimeout(id);
  }, [done, books, scope, start, onFinish]);

  const onChange = (value: string) => {
    setInput(value);
    if (!next) return;
    // Accepted the moment it matches, so there's no need to press Enter.
    if (acceptedNames(next).has(normalizeName(value))) {
      play("correct");
      setCount((c) => c + 1);
      setInput("");
      setNote(null);
      setLetters(0);
    }
  };

  const onEnter = () => {
    if (!input.trim() || !next) return;
    const b = findBook(input);
    play("wrong");
    if (!b) setNote(t("Hmm, that's not a book name. Check the spelling!"));
    else if (b.order < next.order) setNote(t("{book} is already on the shelf!", { book: name(b) }));
    else setNote(t("{book} comes later. What comes after {prev}?", { book: name(b), prev: count ? name(books[count - 1]) : "…" }));
  };

  const hint = () => {
    if (!profile || profile.coins < HINT_COST || !next) return;
    setProfile((p) => ({ ...p, coins: p.coins - HINT_COST }));
    play("click");
    setLetters((l) => Math.min(name(next).length, l + 2));
    inputRef.current?.focus();
  };

  const giveUp = () => onFinish({ scope, typed: books.slice(0, count).map((b) => b.id), seconds, complete: false });

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <button type="button" onClick={onQuit} aria-label={t("Quit game")} className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white">
          <X className="size-5" />
        </button>
        <span className="font-bold text-amber-300">{title}</span>
        <span className="ml-auto text-sm text-stone-300 tabular-nums">
          ⌨️ {count} / {books.length}
        </span>
        <span className="text-sm text-stone-300 tabular-nums">⏱️ {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
      </Panel>
      <ProgressBar value={count / books.length} />

      {!done ? (
        <Panel className="flex flex-col gap-3">
          <label htmlFor="type-book" className="text-center text-stone-300">
            {count === 0 ? t("Type the first book:") : t("What comes after {book}?", { book: name(books[count - 1]) })}
          </label>
          <input
            id="type-book"
            ref={inputRef}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnter()}
            placeholder={letters ? `${name(next).slice(0, letters)}…` : t("Type a book name…")}
            className={cn("rounded-xl bg-stone-950 px-4 py-3 text-center text-2xl font-bold text-white ring-2 ring-amber-400/40 outline-none focus:ring-amber-400", note && "bible-shake")}
          />
          {note && <p className="text-center text-sm text-red-300">{note}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={hint}
              disabled={!profile || profile.coins < HINT_COST || letters >= name(next).length}
              className="rounded-full bg-stone-800 px-3 py-1.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-200/20 hover:bg-stone-700 disabled:opacity-40"
            >
              {t("🦉 Show 2 letters ({n} 🪙)", { n: HINT_COST })}
            </button>
            <GameButton tone="ghost" className="py-1.5 text-sm" onClick={giveUp}>
              {t("🏳️ Stop here")}
            </GameButton>
          </div>
        </Panel>
      ) : (
        <Selah mood="party" className="bible-pop self-center">
          {t("All {n} books, in order. Amazing!", { n: books.length })}
        </Selah>
      )}

      <Panel className="bg-gradient-to-b from-amber-950/60 to-stone-900/80">
        <div className="flex flex-wrap items-end gap-x-0.5 gap-y-3">
          {books.slice(0, count).map((b) => (
            <div key={b.id} className="bible-slot border-b-8 border-amber-800">
              <Spine book={b} height={spineHeight(b)} />
            </div>
          ))}
          {!done && <div className="h-24 w-7 animate-pulse rounded-t-md border-2 border-dashed border-amber-300 sm:w-8" />}
        </div>
      </Panel>
    </div>
  );
}
