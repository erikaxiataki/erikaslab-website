"use client";

import { useCallback } from "react";
import type { Country } from "./countries";
import { FR } from "./i18n-fr";
import { displayNickname } from "./identity";
import { useProfile } from "./store";

export type Lang = "en" | "fr";

/**
 * Translate an English UI string. English text is the key, so untranslated strings fall back to English.
 * `{name}`-style placeholders are filled from `vars`.
 */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let s = lang === "fr" ? (FR[key] ?? key) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, typeof v === "number" ? v.toLocaleString(lang) : v);
  return s;
}

export function countryName(c: Pick<Country, "name" | "nameFr">, lang: Lang) {
  return lang === "fr" ? c.nameFr : c.name;
}

export function capitalName(c: Pick<Country, "capital" | "capitalFr">, lang: Lang) {
  return (lang === "fr" ? c.capitalFr : c.capital) ?? "—";
}

export function useI18n() {
  const lang: Lang = useProfile()?.lang ?? "en";
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return {
    lang,
    t,
    name: (c: Pick<Country, "name" | "nameFr">) => countryName(c, lang),
    capital: (c: Pick<Country, "capital" | "capitalFr">) => capitalName(c, lang),
    nick: (n: string) => displayNickname(n, lang),
    num: (n: number) => n.toLocaleString(lang),
  };
}
