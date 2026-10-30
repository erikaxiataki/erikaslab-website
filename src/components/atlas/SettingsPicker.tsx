"use client";

import { SCOPES, SCOPE_EMOJI, type Scope } from "@/lib/atlas/countries";
import { DIFFICULTY, type Difficulty, MODES, type Mode } from "@/lib/atlas/game";
import { useI18n } from "@/lib/atlas/i18n";
import { cn } from "@/lib/utils";
import { Chip } from "./ui";

export type Settings = { mode: Mode; scope: Scope; difficulty: Difficulty };

export function SettingsPicker({
  value,
  onChange,
  disabled,
}: {
  value: Settings;
  onChange: (s: Settings) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-4 disabled:opacity-70">
      <div>
        <legend className="mb-2 text-sm font-bold text-slate-300 uppercase">{t("Game")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={value.mode === m.id}
              onClick={() => onChange({ ...value, mode: m.id })}
              className={cn(
                "rounded-xl p-3 text-left ring-2 transition",
                value.mode === m.id ? "bg-violet-500/25 ring-violet-400" : "bg-slate-800 ring-transparent hover:ring-white/20",
              )}
            >
              <div className="text-2xl">{m.emoji}</div>
              <div className="font-bold text-white">{t(m.label)}</div>
              <div className="text-xs text-slate-400">{t(m.blurb)}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-slate-300 uppercase">{t("Where")}</div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <Chip key={s} active={value.scope === s} onClick={() => onChange({ ...value, scope: s })}>
              {SCOPE_EMOJI[s]} {t(s)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-slate-300 uppercase">{t("Difficulty")}</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <Chip key={d} active={value.difficulty === d} onClick={() => onChange({ ...value, difficulty: d })}>
              {DIFFICULTY[d].emoji} {t(DIFFICULTY[d].label)} · {DIFFICULTY[d].seconds}s
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {value.difficulty === "easy" && t("Big, well-known countries. Lots of time.")}
          {value.difficulty === "normal" && t("Most countries, trickier choices. 1.5× points.")}
          {value.difficulty === "hard" && t("Every country, even tiny islands. Choices from neighbors. 2.5× points!")}
        </p>
      </div>
    </fieldset>
  );
}
