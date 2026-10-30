"use client";

import { type ComponentProps, useMemo } from "react";
import { type Country, flagUrl } from "@/lib/atlas/countries";
import { countryName, useI18n } from "@/lib/atlas/i18n";
import { cn } from "@/lib/utils";

/** A country's flag. Pass `label` to override the alt text (e.g. to keep quiz answers secret). */
export function Flag({
  country,
  label,
  className,
}: {
  country: Pick<Country, "code" | "name"> & Partial<Pick<Country, "nameFr" | "namePt">>;
  label?: string;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const name = countryName(country, lang);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVGs; next/image adds nothing here
    <img
      src={flagUrl(country.code)}
      alt={label ?? t("Flag of {name}", { name })}
      draggable={false}
      className={cn("aspect-[4/3] rounded-md object-cover shadow-md ring-1 ring-white/15", className)}
    />
  );
}

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-slate-900/80 p-4 ring-1 ring-white/10 backdrop-blur", className)} {...props} />;
}

const TONES = {
  primary: "bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-[0_4px_0_#3730a3] hover:brightness-110",
  go: "bg-gradient-to-b from-emerald-400 to-green-600 text-white shadow-[0_4px_0_#166534] hover:brightness-110",
  warn: "bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 shadow-[0_4px_0_#9a3412] hover:brightness-110",
  ghost: "bg-slate-800 text-slate-100 shadow-[0_4px_0_#0f172a] ring-1 ring-white/10 hover:bg-slate-700",
} as const;

export function GameButton({
  tone = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { tone?: keyof typeof TONES }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold tracking-wide transition active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-40",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  active,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition",
        active ? "bg-violet-500 text-white ring-violet-300" : "bg-slate-800 text-slate-300 ring-white/10 hover:bg-slate-700",
        className,
      )}
      {...props}
    />
  );
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300", barClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

const CONFETTI_COLORS = ["#a78bfa", "#f472b6", "#facc15", "#34d399", "#60a5fa", "#fb923c"];

/** CSS-only confetti burst. Re-mount (change `key`) to fire again. */
export function Confetti({ count = 80, seed = 1 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
    // Deterministic pseudo-random numbers so renders stay pure.
    const rand = (i: number, k: number) => {
      const x = Math.sin(seed * 97.13 + i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      left: rand(i, 1) * 100,
      dx: (rand(i, 2) - 0.5) * 300,
      dur: 2 + rand(i, 3) * 2,
      delay: rand(i, 4) * 0.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
  }, [count, seed]);
  return (
    <div aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="atlas-confetti"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              "--dx": `${p.dx}px`,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-black tracking-tight text-white sm:text-2xl", className)}>{children}</h2>;
}
