import type { Metadata, Viewport } from "next";
import { BibleGame } from "./BibleGame";

export const metadata: Metadata = {
  title: "Bible Quest: Learn the Books of the Bible",
  description: "A game for kids to learn the 66 books of the Bible in order, with quizzes, a quest map, XP and badges. In English, French and Portuguese.",
  applicationName: "Bible Quest",
  manifest: "/bible/manifest.webmanifest",
  appleWebApp: { title: "Bible Quest", capable: true },
};

export const viewport: Viewport = {
  themeColor: "#140e09",
};

export default function BiblePage() {
  return (
    <div className="flex-1 bg-[#140e09] bg-[radial-gradient(ellipse_at_top,#78350f_0%,transparent_60%)] text-stone-100">
      <main className="mx-auto w-full max-w-5xl px-4 pb-16">
        <BibleGame />
      </main>
    </div>
  );
}
