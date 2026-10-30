import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#070b18] bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_60%)] px-4 py-24 text-center text-slate-100">
      <p className="text-sm font-bold tracking-widest text-violet-300 uppercase">Erika&apos;s Lab</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-6xl">Fun little projects to play and learn with.</h1>
      <p lang="fr" className="mt-3 text-lg text-slate-400">De petits projets pour jouer et apprendre.</p>
      <Link
        href="/atlas"
        className="group mt-10 flex max-w-md items-center gap-4 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-600/20 p-5 text-left ring-1 ring-violet-400/40 transition hover:-translate-y-1 hover:brightness-125"
      >
        <span className="text-5xl transition group-hover:scale-110">🌍</span>
        <span>
          <span className="block text-xl font-black text-white">Atlas Quest</span>
          <span className="block text-slate-300">
            Master the world map, flags and capitals. Earn badges and battle your friends online.
          </span>
          <span lang="fr" className="mt-1 block text-sm text-slate-400">
            Maîtrise la carte du monde, les drapeaux et les capitales. En anglais ou en français !
          </span>
        </span>
      </Link>
    </div>
  );
}
