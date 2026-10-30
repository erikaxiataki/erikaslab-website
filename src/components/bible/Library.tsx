"use client";

import { useState } from "react";
import { type Book, SECTIONS, booksIn, sectionOf } from "@/lib/bible/books";
import { useI18n } from "@/lib/bible/i18n";
import { MASTERED, masteredCount } from "@/lib/bible/progress";
import { useProfile } from "@/lib/bible/store";
import { Panel, ProgressBar, SectionTitle, Selah, Spine, Stars } from "./ui";
import { spineHeight } from "./Bookshelf";

/** The Great Library: every mastered book is back on the shelf; tap any book to read its card. */
export function Library() {
  const profile = useProfile();
  const { t, book: name, summary, section: sectionName, num } = useI18n();
  const [open, setOpen] = useState<Book | null>(null);
  if (!profile) return null;
  const total = masteredCount(profile);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <SectionTitle>🏛️ {t("The Great Library")}</SectionTitle>
        <p className="mt-1 text-stone-400">{t("A storm scattered all 66 books! Each book you master goes back on the shelf.")}</p>
        <div className="mx-auto mt-3 flex max-w-sm items-center gap-2">
          <ProgressBar value={total / 66} className="h-3 flex-1" />
          <span className="font-black text-amber-300 tabular-nums">{num(total)} / 66</span>
        </div>
      </div>

      {open && (
        <Panel className="bible-pop flex flex-col items-center gap-2 text-center" style={{ boxShadow: `inset 0 6px 0 ${sectionOf(open).color}` }}>
          <span className="text-5xl">{open.emoji}</span>
          <span className="text-2xl font-black text-white">{name(open)}</span>
          <span className="text-sm text-stone-400">
            {t("Book #{n}", { n: open.order })} · {sectionOf(open).emoji} {sectionName(sectionOf(open))} · {t("{n} chapters", { n: open.chapters })}
          </span>
          <p className="max-w-md text-amber-50">{summary(open)}</p>
          <Stars n={profile.mastery[open.id] ?? 0} max={5} />
          {(profile.mastery[open.id] ?? 0) < MASTERED && <p className="text-xs text-stone-400">{t("Get it right a few more times to put it back on the shelf.")}</p>}
        </Panel>
      )}

      {(["OT", "NT"] as const).map((testament) => (
        <Panel key={testament} className="bg-gradient-to-b from-amber-950/60 to-stone-900/80">
          <h3 className="mb-3 font-black text-amber-200">
            {testament === "OT" ? t("Old Testament") : t("New Testament")} · {num(masteredCount(profile, testament))} / {booksIn(testament).length}
          </h3>
          <div className="flex flex-wrap items-end gap-x-0.5 gap-y-3">
            {booksIn(testament).map((b) => (
              <div key={b.id} className="border-b-8 border-amber-800">
                <Spine book={b} height={spineHeight(b)} faded={(profile.mastery[b.id] ?? 0) < MASTERED} onClick={() => setOpen(b)} />
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SECTIONS.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-stone-300">
            <span className="size-3 rounded-sm" style={{ background: s.color }} /> {sectionName(s)}
          </span>
        ))}
      </Panel>
      {total === 0 && <Selah>{t("Play any game to start bringing books back!")}</Selah>}
    </div>
  );
}
