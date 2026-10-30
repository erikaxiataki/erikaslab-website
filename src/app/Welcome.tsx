"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/atlas/i18n";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";

const CHOICES: { lang: Lang; flag: string; label: string; hint: string; last: string }[] = [
  { lang: "fr", flag: "fr", label: "Français", hint: "Jouer en français", last: "Ton dernier choix" },
  { lang: "en", flag: "gb", label: "English", hint: "Play in English", last: "Your last choice" },
];

/** Home page: pick Français or English, then play. The previous choice is highlighted. */
export function Welcome() {
  const router = useRouter();
  const profile = useProfile();

  const choose = (lang: Lang) => {
    setProfile((p) => ({ ...p, lang }));
    router.push("/atlas");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#070b18] bg-[radial-gradient(ellipse_at_top,#2e1065_0%,transparent_65%)] px-4 py-16 text-center text-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
      <img src="/icon.svg" alt="" width={128} height={128} className="atlas-pop size-28 rounded-[28px] shadow-2xl shadow-violet-900/60 sm:size-32" />
      <div>
        <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
          Atlas<span className="text-violet-400">Quest</span>
        </h1>
        <p className="mt-3 text-slate-400">
          <span lang="fr">Choisis ta langue</span> · <span lang="en">Choose your language</span>
        </p>
      </div>
      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        {CHOICES.map((c) => {
          const last = profile?.lang === c.lang;
          return (
            <button
              key={c.lang}
              type="button"
              lang={c.lang}
              onClick={() => choose(c.lang)}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl bg-slate-900/80 p-6 ring-2 transition hover:-translate-y-1 hover:bg-violet-500/20 hover:ring-violet-400 focus-visible:ring-violet-400",
                last ? "ring-violet-400/70" : "ring-white/10",
              )}
            >
              {last && (
                <span className="absolute -top-3 rounded-full bg-violet-500 px-2.5 py-0.5 text-xs font-bold text-white">{c.last}</span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- local flag SVG */}
              <img src={`/flags/${c.flag}.svg`} alt="" className="h-16 w-auto rounded-lg shadow-lg ring-1 ring-white/20 transition group-hover:scale-110" />
              <span className="text-2xl font-black text-white">{c.label}</span>
              <span className="text-sm text-slate-400">{c.hint}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
