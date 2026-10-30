import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AtlasGame } from "./AtlasGame";

export const metadata: Metadata = {
  title: "Atlas Quest: World Geography Game",
  description: "Learn the world map, countries, flags and capitals. Earn XP and badges, and challenge your friends.",
};

export const viewport: Viewport = {
  themeColor: "#070b18",
};

export default function AtlasPage() {
  return (
    <div className="flex-1 bg-[#070b18] bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_60%)] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-slate-400">Loading… 🌍</div>}>
          <AtlasGame />
        </Suspense>
      </main>
    </div>
  );
}
