export const revalidate = 3600;

import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { SUBJECTS } from "@/lib/subjects";
import { FEATURED_PRICE_EUR, SITE_NAME, launchPromo } from "@/lib/config";

export default function HomePage() {
  const promo = launchPromo();
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:pt-14">
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Instruktor za <span className="text-brand-600">peticu</span>, blizu vas ili online
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
            Opišite što vas muči — predložit ćemo predmet i pokazati instruktore u vašem gradu. Dogovor i plaćanje
            izravno s instruktorom, bez provizije.
          </p>
          <div className="mt-6 max-w-2xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <Link
          href="/priprema-za-maturu"
          className="flex flex-col gap-3 rounded-2xl bg-brand-700 p-5 text-white shadow-md transition hover:bg-brand-800 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div>
            <p className="text-xs font-bold tracking-wider text-gold-400 uppercase">Istaknuto</p>
            <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">Priprema za državnu maturu 🎓</h2>
            <p className="mt-1 text-sm text-brand-100">
              Matematika, hrvatski, engleski i izborni predmeti — instruktori koji znaju kako izgleda ispit.
            </p>
          </div>
          <span className="btn bg-white text-brand-800 hover:bg-brand-50">Pogledaj instruktore →</span>
        </Link>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4">
        <h2 className="text-xl font-extrabold text-slate-900">Predmeti</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <Link
              key={s.slug}
              href={`/instrukcije/${s.slug}`}
              className="card flex items-center gap-2 p-3 text-sm font-semibold text-slate-800 hover:border-brand-300"
            >
              <span className="text-xl" aria-hidden>{s.emoji}</span>
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {[
          ["1. Pronađite", "Filtrirajte po predmetu, razini, gradu, cijeni i terminu. Profili imaju recenzije stvarnih korisnika."],
          ["2. Javite se", "Pošaljite poruku instruktoru izravno u aplikaciji i dogovorite termin, mjesto i cijenu."],
          ["3. Učite i ocijenite", "Plaćate izravno instruktoru. Nakon razgovora možete ostaviti recenziju i pomoći drugima."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <h3 className="font-bold text-slate-900">{t}</h3>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Držite instrukcije?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Osnovni profil na {SITE_NAME} je besplatan. Istaknuti profil {FEATURED_PRICE_EUR} €/mj
              {promo.active ? " — sada besplatno tijekom lansiranja!" : "."} Bez provizije na vaše sate.
            </p>
          </div>
          <Link href="/registracija?uloga=instruktor" className="btn-gold">Postani instruktor</Link>
        </div>
      </section>
    </>
  );
}
