"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { COUNTRIES, type Country, SCOPES, SCOPE_EMOJI, type Scope, inScope, matchesSearch } from "@/lib/atlas/countries";
import { useI18n } from "@/lib/atlas/i18n";
import { useProfile } from "@/lib/atlas/store";
import { Chip, Flag, Panel, SectionTitle } from "./ui";
import { MAP_COLORS, WorldMap, countryFocus } from "./WorldMap";

export function masteryColors(mastery: Record<string, number>) {
  const out: Record<string, string> = {};
  for (const [code, level] of Object.entries(mastery)) if (level > 0) out[code] = MAP_COLORS.mastery[Math.min(5, level)];
  return out;
}

export function Explore() {
  const profile = useProfile();
  const { t, name, capital, num } = useI18n();
  const [scope, setScope] = useState<Scope>("World");
  const [selected, setSelected] = useState<Country | null>(null);
  const [query, setQuery] = useState("");
  const [showMastery, setShowMastery] = useState(false);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return COUNTRIES.filter((c) => c.mapId && matchesSearch(c, query)).slice(0, 6);
  }, [query]);

  const colors = useMemo(() => {
    const base = showMastery && profile ? masteryColors(profile.mastery) : {};
    return selected ? { ...base, [selected.code]: MAP_COLORS.selected } : base;
  }, [showMastery, profile, selected]);

  const select = (c: Country) => {
    setSelected(c);
    setQuery("");
    if (!inScope(c, scope)) setScope("World");
  };

  const neighbors = selected ? COUNTRIES.filter((c) => c.subregion === selected.subregion && c.code !== selected.code && c.independent) : [];

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SectionTitle className="mr-auto">{t("🔭 Explore the world")}</SectionTitle>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={showMastery} onChange={(e) => setShowMastery(e.target.checked)} className="accent-violet-500" />
            {t("Color by what I know")}
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <Chip key={s} active={scope === s} onClick={() => { setScope(s); setSelected(null); }}>
              {SCOPE_EMOJI[s]} {t(s)}
            </Chip>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search a country or capital…")}
            className="w-full rounded-xl bg-slate-800 py-2.5 pr-3 pl-9 text-white ring-1 ring-white/10 outline-none placeholder:text-slate-500 focus:ring-violet-400"
          />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/10">
              {matches.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => select(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-700">
                    <Flag country={c} className="h-5 rounded-sm" />
                    <span className="font-semibold text-white">{name(c)}</span>
                    <span className="text-xs text-slate-400">{capital(c)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {showMastery && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {t("Still learning")}
            {MAP_COLORS.mastery.map((c) => (
              <span key={c} className="size-3 rounded-sm" style={{ background: c }} />
            ))}
            {t("Mastered")}
          </div>
        )}
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <WorldMap scope={scope} colors={colors} onPick={select} showNames focus={selected ? countryFocus(selected) : null} className="self-start" />
        <Panel className="atlas-pop" key={selected?.code ?? "none"}>
          {selected ? (
            <div className="flex flex-col gap-3">
              <Flag country={selected} className="w-full" />
              <div>
                <h3 className="text-2xl font-black text-white">{name(selected)}</h3>
                <p className="text-slate-400">{t(selected.independent ? "Country in {place}" : "Territory in {place}", { place: t(selected.subregion) })}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Fact label={t("🏛️ Capital")} value={capital(selected)} />
                <Fact label={t("🌐 Continent")} value={t(selected.region)} />
                <Fact label={t("📐 Area")} value={`${num(selected.area)} km²`} />
                <Fact label={t("🌊 Coast")} value={selected.landlocked ? t("Landlocked") : t("Has a coast")} />
                {profile && <Fact label={t("⭐ You know it")} value={"★".repeat(profile.mastery[selected.code] ?? 0) + "☆".repeat(5 - (profile.mastery[selected.code] ?? 0))} />}
              </dl>
              {neighbors.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-400 uppercase">{t("Same neighborhood")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {neighbors.slice(0, 12).map((c) => (
                      <button key={c.code} type="button" onClick={() => select(c)} title={name(c)}>
                        <Flag country={c} className="h-6 rounded-sm hover:ring-violet-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-slate-400">
              <span className="text-5xl">👆</span>
              <p>{t("Tap any country on the map to see its flag, capital and more.")}</p>
              <p className="text-xs">{t("Pinch or scroll to zoom. Drag to move.")}</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800 p-2">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-bold text-white">{value}</dd>
    </div>
  );
}
