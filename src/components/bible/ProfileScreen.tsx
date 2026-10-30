"use client";

import { Copy, Download, Upload } from "lucide-react";
import { useState } from "react";
import { play } from "@/lib/atlas/sound";
import { exportProfile, importProfile, mergeProfiles } from "@/lib/bible/backup";
import { useI18n } from "@/lib/bible/i18n";
import { BADGES, SHIELD_COST, levelFromXp, masteredCount, rankFor } from "@/lib/bible/progress";
import { setProfile, useProfile } from "@/lib/bible/store";
import { cn } from "@/lib/utils";
import { GameButton, Panel, ProgressBar, SectionTitle } from "./ui";

export function ProfileScreen() {
  const profile = useProfile();
  const { t, num } = useI18n();
  if (!profile) return null;
  const { level, into, need } = levelFromXp(profile.xp);
  const rank = rankFor(level);
  const stats: [string, string | number][] = [
    ["📚 Books mastered", `${masteredCount(profile)} / 66`],
    ["🎮 Games played", profile.gamesPlayed],
    ["✅ Right answers", profile.totalCorrect],
    ["🔥 Best streak", profile.bestStreak],
    ["📅 Daily streak", profile.dailyStreak],
    ["🛡️ Streak shields", profile.shields],
  ];

  const buyShield = () => {
    if (profile.coins < SHIELD_COST) return;
    play("levelup");
    setProfile((p) => ({ ...p, coins: p.coins - SHIELD_COST, shields: p.shields + 1 }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-2 text-center">
        <span className="text-6xl">{rank.emoji}</span>
        <p className="text-2xl font-black text-white">{t(rank.title)}</p>
        <p className="text-stone-300">{t("Level {n}", { n: level })}</p>
        <ProgressBar value={into / need} className="h-3 w-full max-w-xs" />
        <p className="text-xs text-stone-400">{t("{n} XP to the next level", { n: need - into })}</p>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(([label, v]) => (
          <Panel key={label} className="py-3 text-center">
            <p className="text-2xl font-black text-white tabular-nums">{typeof v === "number" ? num(v) : v}</p>
            <p className="text-xs text-stone-400">{t(label)}</p>
          </Panel>
        ))}
      </div>
      <Panel className="flex flex-wrap items-center gap-3">
        <span className="text-3xl">🛡️</span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-white">{t("Streak shield")}</p>
          <p className="text-sm text-stone-400">{t("Missed a day? A shield saves your daily streak once.")}</p>
        </div>
        <GameButton onClick={buyShield} disabled={profile.coins < SHIELD_COST}>
          {t("Buy for {n} 🪙", { n: SHIELD_COST })}
        </GameButton>
      </Panel>
      <Panel className="flex flex-col gap-3">
        <SectionTitle>
          🏅 {t("Badges")} · {profile.badges.length} / {BADGES.length}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b) => {
            const has = profile.badges.includes(b.id);
            return (
              <div key={b.id} className={cn("flex items-center gap-2 rounded-xl p-2 ring-1", has ? "bg-amber-400/15 ring-amber-300/40" : "bg-stone-800/60 opacity-60 ring-white/5")}>
                <span className={cn("text-3xl", !has && "grayscale")}>{b.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm leading-tight font-black text-white">{t(b.name)}</span>
                  <span className="block text-xs leading-tight text-stone-400">{t(b.how)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
      <SaveRestore />
    </div>
  );
}

/** Back up progress as a code/file and restore it on another device. No accounts needed. */
function SaveRestore() {
  const profile = useProfile();
  const { t } = useI18n();
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  if (!profile) return null;

  const backup = async () => {
    setCode(await exportProfile(profile));
    setCopied(false);
    play("click");
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    if (!code) return;
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bible-quest-save-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (text: string) => {
    const saved = await importProfile(text);
    if (!saved) {
      play("wrong");
      setMsg({ ok: false, text: t("That save code doesn't look right. Check you copied all of it.") });
      return;
    }
    setProfile(mergeProfiles(profile, saved));
    play("levelup");
    setInput("");
    setMsg({ ok: true, text: t("Progress restored! 🎉") });
  };

  const fromFile = async (file: File | undefined) => {
    if (file) await restore(await file.text());
  };

  return (
    <Panel className="flex flex-col gap-3">
      <SectionTitle>💾 {t("Save code")}</SectionTitle>
      <p className="text-sm text-stone-400">{t("Your progress is saved on this device. To play on another device, make a save code and restore it there.")}</p>
      <div className="flex flex-wrap gap-2">
        <GameButton tone="sky" onClick={backup}>
          {t("Make a save code")}
        </GameButton>
        {code && (
          <>
            <GameButton tone="ghost" onClick={copy}>
              <Copy className="size-4" /> {copied ? t("Copied!") : t("Copy")}
            </GameButton>
            <GameButton tone="ghost" onClick={download}>
              <Download className="size-4" /> {t("Download")}
            </GameButton>
          </>
        )}
      </div>
      {code && <textarea readOnly value={code} rows={3} className="w-full rounded-xl bg-stone-950 p-2 font-mono text-xs break-all text-stone-300" onFocus={(e) => e.target.select()} />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Paste a save code…")}
          className="min-w-0 flex-1 rounded-xl bg-stone-950 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-amber-400"
        />
        <GameButton tone="go" onClick={() => restore(input)} disabled={!input.trim()}>
          {t("Restore")}
        </GameButton>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-2.5 font-bold text-stone-100 ring-1 ring-white/10 hover:bg-stone-700">
          <Upload className="size-4" /> {t("From file")}
          <input type="file" accept=".txt,text/plain" className="hidden" onChange={(e) => fromFile(e.target.files?.[0])} />
        </label>
      </div>
      {msg && <p className={msg.ok ? "text-emerald-300" : "text-red-300"}>{msg.text}</p>}
    </Panel>
  );
}
