import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { SUBJECTS } from "@/lib/subjects";
import { FEATURED_PRICE_EUR, SITE_NAME, launchPromo } from "@/lib/config";

export const revalidate = 3600;

const SUBJECT_HINTS: Record<string, string> = {
  matematika: "OŠ, SŠ, fakultet",
  "hrvatski-jezik": "lektira, esej",
  "engleski-jezik": "škola, Cambridge ispiti",
  fizika: "SŠ, fakultet",
  kemija: "OŠ, SŠ",
  biologija: "SŠ, matura",
  "njemacki-jezik": "škola, Goethe ispiti",
  programiranje: "Python, Java",
};

export default function HomePage() {
  const promo = launchPromo();
  const top = SUBJECTS.filter((s) => SUBJECT_HINTS[s.slug]);
  return (
    <>
      <section className="rounded-b-[28px] bg-board text-chalk">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 pb-10 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-14 md:pb-16">
          <div>
            <h1 className="font-display text-[42px] leading-[1.02] font-extrabold sm:text-6xl">
              Instrukcije
              <br />
              <span className="text-gold-400">za bolje</span>
              <br />
              rezultate.
            </h1>
            <p className="mt-4 max-w-md text-base text-brand-100 sm:text-lg">
              Instruktori za osnovnu i srednju školu, državnu maturu i fakultet — uživo, s dolaskom kući ili
              online. Termin rezervirate izravno prema rasporedu instruktora, bez provizije.
            </p>
            <Link
              href="/pretraga?hitno=1"
              className="mt-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-gold-400 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-white/10"
            >
              <Zap className="size-4 fill-current" aria-hidden /> Hitne instrukcije — termini danas
            </Link>
          </div>
          <HeroSearch />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-6">
        <Link
          href="/priprema-za-maturu"
          className="flex items-center justify-between gap-4 rounded-[18px] bg-gold-400 p-5 text-board sm:p-6"
        >
          <span>
            <span className="block font-display text-2xl font-extrabold sm:text-3xl">Priprema za državnu maturu</span>
            <span className="mt-1 block text-sm sm:text-base">
              Matematika (A i B razina), hrvatski jezik, engleski jezik i izborni predmeti.
            </span>
          </span>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-board text-gold-400">
            <ArrowRight className="size-5" aria-hidden />
          </span>
        </Link>

        <section>
          <h2 className="font-display text-2xl font-extrabold">Predmeti</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {top.map((s) => (
              <Link key={s.slug} href={`/instrukcije/${s.slug}`} className="card flex flex-col p-4 hover:border-brand-300">
                <span className="font-semibold">{s.name}</span>
                <span className="text-[13px] text-slate-600">{SUBJECT_HINTS[s.slug]}</span>
              </Link>
            ))}
            <Link href="/instrukcije" className="flex flex-col rounded-[18px] bg-board p-4 text-chalk">
              <span className="font-semibold">Svih {SUBJECTS.length}</span>
              <span className="text-[13px] text-brand-100">predmeta</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["Pretraga", "Odaberite predmet, razinu, grad, cijenu i željeni termin."],
            ["Rezervacija", "Slobodni termini izračunavaju se iz rasporeda instruktora; rezervacija se potvrđuje odmah."],
            ["Instrukcije i recenzija", "Naknadu plaćate izravno instruktoru. Nakon razmjene poruka možete ostaviti recenziju."],
          ].map(([t, d], i) => (
            <div key={t} className="card p-5">
              <span className="font-display text-3xl font-extrabold text-gold-500">{i + 1}</span>
              <h3 className="mt-1 font-display text-lg font-extrabold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4 rounded-[18px] bg-board p-6 text-chalk sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Za instruktore</h2>
            <p className="mt-1 text-sm text-brand-100">
              Osnovni profil na {SITE_NAME} je besplatan. Istaknuti profil {FEATURED_PRICE_EUR} €/mj
              {promo.active ? " — besplatno tijekom razdoblja lansiranja." : "."} Platforma ne naplaćuje proviziju na održane sate.
            </p>
          </div>
          <Link href="/registracija?uloga=instruktor" className="btn-gold shrink-0">Registracija instruktora</Link>
        </section>
      </div>
    </>
  );
}
