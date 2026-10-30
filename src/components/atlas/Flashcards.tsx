"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { QUIZ_COUNTRIES, SCOPES, SCOPE_EMOJI, type Scope, inScope, matchesSearch } from "@/lib/atlas/countries";
import { useI18n } from "@/lib/atlas/i18n";
import { useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { Chip, Flag, Panel, SectionTitle } from "./ui";

export function Flashcards() {
  const profile = useProfile();
  const { t, name, capital } = useI18n();
  const [scope, setScope] = useState<Scope>("Europe");
  const [query, setQuery] = useState("");
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [hideKnown, setHideKnown] = useState(false);

  const cards = useMemo(() => {
    return QUIZ_COUNTRIES.filter(
      (c) =>
        inScope(c, scope) &&
        matchesSearch(c, query) &&
        (!hideKnown || (profile?.mastery[c.code] ?? 0) < 3),
    );
  }, [scope, query, hideKnown, profile]);

  const known = QUIZ_COUNTRIES.filter((c) => inScope(c, scope) && (profile?.mastery[c.code] ?? 0) >= 3).length;
  const total = QUIZ_COUNTRIES.filter((c) => inScope(c, scope)).length;

  const toggle = (code: string) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SectionTitle className="mr-auto">{t("🃏 Flag flashcards")}</SectionTitle>
          <span className="text-sm text-slate-300">
            {t("You know {n} of {total} here", { n: known, total })}
          </span>
        </div>
        <p className="text-sm text-slate-400">{t("Guess the country, then tap the card to flip it. Play quizzes to fill your ★ stars.")}</p>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <Chip key={s} active={scope === s} onClick={() => setScope(s)}>
              {SCOPE_EMOJI[s]} {t(s)}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search…")}
              className="w-full rounded-xl bg-slate-800 py-2 pr-3 pl-9 text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-violet-400"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={hideKnown} onChange={(e) => setHideKnown(e.target.checked)} className="accent-violet-500" />
            {t("Hide ones I know")}
          </label>
          <button type="button" onClick={() => setFlipped(flipped.size ? new Set() : new Set(cards.map((c) => c.code)))} className="text-sm font-bold text-violet-300 hover:underline">
            {flipped.size ? t("Flip all back") : t("Flip all")}
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const open = flipped.has(c.code);
          const stars = profile?.mastery[c.code] ?? 0;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => toggle(c.code)}
              className={cn(
                "flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl p-3 ring-1 transition hover:-translate-y-0.5",
                open ? "bg-violet-600/30 ring-violet-400" : "bg-slate-900 ring-white/10",
              )}
            >
              {open ? (
                <>
                  <span className="text-lg font-black text-white">{name(c)}</span>
                  <span className="text-sm text-slate-300">🏛️ {capital(c)}</span>
                  <span className="text-xs text-slate-400">{t(c.subregion)}</span>
                </>
              ) : (
                <Flag country={c} label={t("Mystery flag")} className="w-full" />
              )}
              <span className="text-xs text-amber-300" aria-label={t("{n} of 5 stars", { n: stars })}>
                {"★".repeat(stars)}
                <span className="text-slate-600">{"★".repeat(5 - stars)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {cards.length === 0 && <p className="py-8 text-center text-slate-400">{t("Nothing here. 🎉")}</p>}
    </div>
  );
}
