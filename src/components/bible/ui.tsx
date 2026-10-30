"use client";

import { type ComponentProps, useMemo } from "react";
import { type Book, sectionOf } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-stone-900/80 p-4 ring-1 ring-amber-100/10 backdrop-blur", className)} {...props} />;
}

const TONES = {
  primary: "bg-gradient-to-b from-amber-400 to-orange-500 text-stone-950 shadow-[0_4px_0_#9a3412] hover:brightness-110",
  go: "bg-gradient-to-b from-emerald-400 to-green-600 text-white shadow-[0_4px_0_#166534] hover:brightness-110",
  sky: "bg-gradient-to-b from-sky-400 to-indigo-500 text-white shadow-[0_4px_0_#3730a3] hover:brightness-110",
  ghost: "bg-stone-800 text-stone-100 shadow-[0_4px_0_#0c0a09] ring-1 ring-white/10 hover:bg-stone-700",
} as const;

export function GameButton({ tone = "primary", className, ...props }: ComponentProps<"button"> & { tone?: keyof typeof TONES }) {
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

export function Chip({ active, className, ...props }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition",
        active ? "bg-amber-400 text-stone-950 ring-amber-200" : "bg-stone-800 text-stone-300 ring-white/10 hover:bg-stone-700",
        className,
      )}
      {...props}
    />
  );
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-stone-800", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-300", barClassName)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-black tracking-tight text-white sm:text-2xl", className)}>{children}</h2>;
}

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#fb923c", "#a78bfa"];

/** CSS-only confetti burst. Re-mount (change `key`) to fire again. */
export function Confetti({ count = 80, seed = 1 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
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
          className="bible-confetti"
          style={{ left: `${p.left}%`, background: p.color, "--dx": `${p.dx}px`, "--dur": `${p.dur}s`, "--delay": `${p.delay}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/** Selah the owl, the game's guide, with a speech bubble. */
export function Selah({ children, mood = "happy", className }: { children: React.ReactNode; mood?: "happy" | "think" | "party"; className?: string }) {
  return (
    <div className={cn("flex items-end gap-2", className)}>
      <span aria-hidden className={cn("text-4xl sm:text-5xl", mood === "party" && "bible-bounce")}>
        🦉
      </span>
      <div className="relative rounded-2xl rounded-bl-sm bg-amber-50 px-3 py-2 text-sm font-semibold text-stone-800 shadow-lg sm:text-base">
        {mood === "party" && <span aria-hidden>🎉 </span>}
        {mood === "think" && <span aria-hidden>💡 </span>}
        {children}
      </div>
    </div>
  );
}

export function Stars({ n, max = 3, className }: { n: number; max?: number; className?: string }) {
  return (
    <span className={cn("tracking-tight", className)} aria-label={`${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? "" : "opacity-25 grayscale"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

/** A book as a wide tile: colored edge for its section, emoji and name. */
export function BookTile({
  book,
  hideName,
  className,
  ...props
}: ComponentProps<"button"> & { book: Book; hideName?: boolean }) {
  const { book: name } = useI18n();
  const color = sectionOf(book).color;
  return (
    <button
      type="button"
      className={cn(
        "relative flex min-h-12 items-center gap-2 overflow-hidden rounded-xl bg-stone-800 py-2 pr-3 pl-4 text-left font-bold text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-stone-700 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-2" style={{ background: color }} />
      <span aria-hidden className="text-xl">{book.emoji}</span>
      <span className="leading-tight">{hideName ? "?" : name(book)}</span>
    </button>
  );
}

/** A book standing on a shelf: tall, narrow, name written down the spine. */
export function Spine({ book, faded, onClick, className, height }: { book: Book; faded?: boolean; onClick?: () => void; className?: string; height?: number }) {
  const { book: name } = useI18n();
  const color = sectionOf(book).color;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={name(book)}
      className={cn(
        "bible-spine relative flex w-7 shrink-0 flex-col items-center justify-between rounded-t-md rounded-b-sm px-0.5 py-1 text-[11px] leading-none font-black text-white shadow-md sm:w-8 sm:text-xs",
        faded && "opacity-40 saturate-0",
        onClick && "transition hover:-translate-y-1",
        className,
      )}
      style={{ background: `linear-gradient(90deg, ${color}cc, ${color} 40%, ${color}aa)`, height: height ?? 112 }}
    >
      <span aria-hidden className="text-[10px]">{book.order}</span>
      <span className="[writing-mode:vertical-rl] overflow-hidden whitespace-nowrap drop-shadow">{name(book)}</span>
      <span aria-hidden className="text-xs">{book.emoji}</span>
    </Tag>
  );
}
