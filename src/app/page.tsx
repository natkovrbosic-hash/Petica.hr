import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { subjectBySlug } from "@/lib/subjects";
import { FEATURED_PRICE_EUR, launchPromo } from "@/lib/config";
import { formatDate } from "@/components/ui";

export const revalidate = 3600;

const GROUPS: { title: string; slugs: string[] }[] = [
  { title: "Matematika i informatika", slugs: ["matematika", "statistika", "informatika", "programiranje"] },
  { title: "Jezici", slugs: ["hrvatski-jezik", "engleski-jezik", "njemacki-jezik", "talijanski-jezik", "francuski-jezik", "spanjolski-jezik", "latinski-jezik"] },
  { title: "Prirodne znanosti", slugs: ["fizika", "kemija", "biologija", "geografija"] },
  { title: "Društveni predmeti", slugs: ["povijest", "filozofija", "ekonomija", "racunovodstvo"] },
  { title: "Razredna nastava", slugs: ["pomoc-u-ucenju"] },
];

const MATURA = [
  ["matematika", "Matematika, viša i osnovna razina"],
  ["hrvatski-jezik", "Hrvatski jezik i esej"],
  ["engleski-jezik", "Engleski jezik"],
  ["fizika", "Fizika"],
  ["kemija", "Kemija"],
  ["biologija", "Biologija"],
] as const;

export default function HomePage() {
  const promo = launchPromo();
  return (
    <>
      <section className="bg-board text-chalk">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-12 md:grid-cols-[minmax(0,1fr)_minmax(0,460px)] md:items-end md:pt-16 md:pb-16">
          <div className="max-w-xl">
            <h1 className="text-[36px] leading-[1.1] font-semibold sm:text-[50px]">Instrukcije iz svih školskih predmeta, uživo ili online</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-chalk/85">
              Instruktori za osnovnu i srednju školu, državnu maturu i fakultet. Termin birate prema rasporedu
              instruktora, a naknadu plaćate izravno njemu.
            </p>
            <p className="mt-5 text-[15px]">
              Trebate instrukcije danas?{" "}
              <Link href="/pretraga?hitno=1" className="font-bold text-gold-400 underline underline-offset-[3px] hover:decoration-2">
                Instruktori sa slobodnim terminom
              </Link>
            </p>
          </div>
          <HeroSearch />
        </div>
        {/* polica za kredu */}
        <div className="h-2.5 bg-ledge" aria-hidden>
          <div className="mx-auto h-full max-w-6xl px-4">
            <div className="relative -top-1 ml-6 h-1.5 w-10 rounded-[2px] bg-gold-400" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-[28px]">Predmeti</h2>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="border-b border-ink pb-2 text-[17px]">{g.title}</h3>
              <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
                {g.slugs.map((slug) => (
                  <li key={slug} className="border-b border-line">
                    <Link href={`/instrukcije/${slug}`} className="block py-2.5 text-[16px] hover:underline hover:underline-offset-[3px]">
                      {subjectBySlug(slug)?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2">
          <div className="max-w-md">
            <h2 className="text-[28px]">Državna matura</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-slate-700">
              Instruktori koji pripremaju za ispite državne mature: rješavanje ispita iz prethodnih rokova, pisanje eseja i
              ponavljanje gradiva po ispitnom katalogu.
            </p>
            <Link href="/priprema-za-maturu" className="link mt-4 inline-block">Svi instruktori za maturu</Link>
          </div>
          <ul className="border-t border-ink">
            {MATURA.map(([slug, label]) => (
              <li key={slug} className="border-b border-line">
                <Link href={`/pretraga?predmet=${slug}&razina=matura`} className="flex justify-between gap-4 py-3 text-[16px] hover:underline hover:underline-offset-[3px]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-[28px]">Kako rezervirati instrukcije</h2>
        <ol className="mt-6 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            ["Odaberite instruktora", "Po predmetu, razini, gradu, cijeni i recenzijama drugih korisnika."],
            ["Rezervirajte termin", "Slobodni termini izračunavaju se iz rasporeda instruktora. Rezervacija se potvrđuje odmah."],
            ["Platite instruktoru", "Naknadu plaćate izravno instruktoru. Petica.hr ne naplaćuje sate i ne uzima proviziju."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="text-[28px] leading-none font-bold text-board">{i + 1}.</span>
              <span>
                <span className="block text-[17px] font-bold">{t}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-slate-700">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-col gap-4 border-t border-ink pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-[22px]">Za instruktore</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
              Osnovni profil je besplatan. Istaknuti profil stoji {FEATURED_PRICE_EUR} € mjesečno
              {promo.active ? `, a do ${formatDate(promo.until)} je besplatan` : ""}. Platforma ne naplaćuje proviziju na
              održane sate.
            </p>
          </div>
          <Link href="/registracija?uloga=instruktor" className="btn-primary shrink-0">Registracija instruktora</Link>
        </div>
      </section>
    </>
  );
}
