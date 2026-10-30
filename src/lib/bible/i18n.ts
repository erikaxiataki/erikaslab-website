"use client";

import { useCallback } from "react";
import { type Book, type Lang, type Section, bookName } from "./books";
import { FR } from "./i18n-fr";
import { PT } from "./i18n-pt";
import { useProfile } from "./store";

export type { Lang };

export const LANGS: { id: Lang; short: string; label: string }[] = [
  { id: "en", short: "EN", label: "English" },
  { id: "fr", short: "FR", label: "Français" },
  { id: "pt", short: "PT", label: "Português" },
];

const DICTS: Record<Lang, Record<string, string> | null> = { en: null, fr: FR, pt: PT };

/**
 * Translate an English UI string. English text is the key, so untranslated strings fall back to English.
 * `{name}`-style placeholders are filled from `vars`.
 */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let s = DICTS[lang]?.[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, typeof v === "number" ? v.toLocaleString(lang) : v);
  return s;
}

export function useI18n() {
  const lang: Lang = useProfile()?.lang ?? "en";
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return {
    lang,
    t,
    book: (b: Book) => bookName(b, lang),
    summary: (b: Book) => b.summary[lang],
    section: (s: Section) => translate(lang, s.name),
    num: (n: number) => n.toLocaleString(lang),
  };
}
