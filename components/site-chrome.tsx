import Link from "next/link";

export function SiteHeader() {
  return (
    <header id="site-header" className="border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-extrabold tracking-tight">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg border-[2.5px] border-ink bg-yellow text-sm">CS</span>
          CS Agent
        </Link>
        <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-1 text-sm font-bold">
          <Link href="/#agen" className="flex min-h-11 items-center rounded-lg px-3 hover:bg-yellow-soft">Pilih agent</Link>
          <Link href="/tutorial" className="flex min-h-11 items-center rounded-lg px-3 hover:bg-yellow-soft">Tutorial</Link>
          <Link href="/#studio" className="btn btn-yellow ml-1">Buka studio</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="site-footer" className="border-t-[3px] border-ink bg-paper">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm">
        <p className="font-bold">Contoh project belajar kelas 11 SMK: Next.js, Netra, dan Deepgram.</p>
        <p>
          Referensi:{" "}
          <a className="font-bold underline decoration-2 underline-offset-2 hover:bg-yellow" href="https://netra.sh/docs/">dokumentasi Netra</a>,{" "}
          <a className="font-bold underline decoration-2 underline-offset-2 hover:bg-yellow" href="https://developers.deepgram.com/docs/">dokumentasi Deepgram</a>,{" "}
          <a className="font-bold underline decoration-2 underline-offset-2 hover:bg-yellow" href="https://nextjs.org/docs">dokumentasi Next.js</a>.
        </p>
      </div>
    </footer>
  );
}
