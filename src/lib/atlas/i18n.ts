"use client";

import { useCallback } from "react";
import type { Country } from "./countries";
import { FR } from "./i18n-fr";
import { PT } from "./i18n-pt";
import { displayNickname } from "./identity";
import { useProfile } from "./store";

export type Lang = "en" | "fr" | "pt";

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

type Named = Pick<Country, "name"> & Partial<Pick<Country, "nameFr" | "namePt">>;
type WithCapital = Pick<Country, "capital"> & Partial<Pick<Country, "capitalFr" | "capitalPt">>;

export function countryName(c: Named, lang: Lang) {
  return (lang === "fr" ? c.nameFr : lang === "pt" ? c.namePt : null) ?? c.name;
}

export function capitalName(c: WithCapital, lang: Lang) {
  return (lang === "fr" ? c.capitalFr : lang === "pt" ? c.capitalPt : c.capital) ?? c.capital ?? "—";
}

export function useI18n() {
  const lang: Lang = useProfile()?.lang ?? "en";
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return {
    lang,
    t,
    name: (c: Named) => countryName(c, lang),
    capital: (c: WithCapital) => capitalName(c, lang),
    nick: (n: string) => displayNickname(n, lang),
    num: (n: number) => n.toLocaleString(lang),
  };
}
