import Link from "next/link";
import { HeroScene } from "@/components/hero-scene";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Studio } from "@/components/studio";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section id="hero" aria-labelledby="hero-title" className="dots overflow-hidden bg-yellow">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div>
              <h1 id="hero-title" className="flex flex-col items-start gap-3 font-extrabold tracking-[-0.035em]">
                <span className="sticker slam py-1 text-2xl sm:text-4xl" style={{ "--tilt": "-3deg" } as React.CSSProperties}>Chat pelanggan</span>
                <span className="sticker-big slam slam-2 ml-4 py-1 text-[2.5rem] sm:ml-8 sm:text-7xl" style={{ "--tilt": "2deg" } as React.CSSProperties}>numpuk?</span>
                <span className="sticker slam slam-3 py-1 text-2xl sm:text-4xl" style={{ "--tilt": "2deg" } as React.CSSProperties}>Telepon toko</span>
                <span className="sticker-big slam slam-4 ml-2 py-1 text-[2.5rem] sm:ml-4 sm:text-7xl" style={{ "--tilt": "-2deg" } as React.CSSProperties}>nggak keangkat?</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-relaxed font-medium sm:text-lg">
                Tulis info usahamu atau unggah PDF. Agent menjawab chat, dikte suara, dan telepon pelanggan hanya dari
                info itu, dengan suara Bahasa Indonesia.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="#studio" className="btn btn-ink-on-yellow min-h-13 px-6 text-base">Buka studio</Link>
                <Link href="#agen" className="flex min-h-11 items-center font-extrabold underline decoration-[3px] underline-offset-4 hover:bg-paper">
                  Dengar 5 suara agent
                </Link>
              </div>
            </div>
            <HeroScene />
          </div>
        </section>

        <Studio />

        <section id="tutorial-cta" aria-labelledby="tutorial-cta-title" className="on-dark dots-light bg-ink text-paper">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14">
            <div className="max-w-2xl">
              <h2 id="tutorial-cta-title" className="text-3xl leading-tight font-extrabold tracking-[-0.03em] sm:text-4xl">
                Mau bikin sendiri dari nol?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-yellow-soft">
                Tutorial empat tingkat untuk kelas 11: dari chat teks, PDF, dikte suara, sampai telepon dengan pilihan agent.
              </p>
            </div>
            <Link href="/tutorial" className="btn btn-yellow min-h-13 px-6 text-base">Baca tutorialnya</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
