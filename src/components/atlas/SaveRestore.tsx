"use client";

import { Copy, Download, Upload } from "lucide-react";
import { useState } from "react";
import { exportProfile, importProfile, mergeProfiles } from "@/lib/atlas/backup";
import { useI18n } from "@/lib/atlas/i18n";
import { levelFromXp } from "@/lib/atlas/progress";
import { play } from "@/lib/atlas/sound";
import { setProfile, useProfile } from "@/lib/atlas/store";
import { cn } from "@/lib/utils";
import { GameButton, Panel, SectionTitle } from "./ui";

/** Back up progress as a code/file and restore it on another device. No accounts needed. */
export function SaveRestore() {
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
    a.download = `atlas-quest-save-${new Date().toISOString().slice(0, 10)}.txt`;
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
    const merged = mergeProfiles(profile, saved);
    setProfile(merged);
    play("levelup");
    setInput("");
    setMsg({
      ok: true,
      text: t("Progress restored! Level {level}, {badges} badges.", { level: levelFromXp(merged.xp).level, badges: merged.badges.length }),
    });
  };

  const loadFile = async (file: File | undefined) => {
    if (file) await restore(await file.text());
  };

  return (
    <Panel className="flex flex-col gap-4">
      <div>
        <SectionTitle>{t("💾 Save & restore")}</SectionTitle>
        <p className="mt-1 text-sm text-slate-400">
          {t("Your progress saves automatically on this device. To play on another phone or computer, make a backup here and restore it there.")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4">
          <p className="font-bold text-white">{t("1. Back up")}</p>
          <GameButton tone="go" onClick={backup} className="self-start">
            {t("💾 Make a save code")}
          </GameButton>
          {code && (
            <>
              <textarea
                readOnly
                value={code}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={t("Your save code")}
                className="h-24 resize-none rounded-lg bg-slate-900 p-2 font-mono text-xs break-all text-slate-300 ring-1 ring-white/10"
              />
              <div className="flex flex-wrap gap-2">
                <GameButton tone="ghost" onClick={copy} className="text-sm">
                  <Copy className="size-4" /> {copied ? t("Copied!") : t("Copy")}
                </GameButton>
                <GameButton tone="ghost" onClick={download} className="text-sm">
                  <Download className="size-4" /> {t("Download file")}
                </GameButton>
              </div>
              <p className="text-xs text-slate-400">{t("Send it to yourself (message or email) and open it on the other device.")}</p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4">
          <p className="font-bold text-white">{t("2. Restore")}</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("Paste your save code here…")}
            aria-label={t("Paste your save code here…")}
            className="h-24 resize-none rounded-lg bg-slate-900 p-2 font-mono text-xs break-all text-white ring-1 ring-white/10 outline-none placeholder:font-sans placeholder:text-slate-500 focus:ring-violet-400"
          />
          <div className="flex flex-wrap gap-2">
            <GameButton onClick={() => restore(input)} disabled={!input.trim()} className="text-sm">
              {t("♻️ Restore")}
            </GameButton>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-slate-100 hover:bg-slate-600">
              <Upload className="size-4" /> {t("Open save file")}
              <input
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                onChange={(e) => {
                  void loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-xs text-slate-400">{t("Nothing is lost: you keep the best of both devices.")}</p>
        </div>
      </div>

      {msg && (
        <p role="status" className={cn("atlas-pop rounded-lg px-3 py-2 text-sm font-bold", msg.ok ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300")}>
          {msg.text}
        </p>
      )}
    </Panel>
  );
}
