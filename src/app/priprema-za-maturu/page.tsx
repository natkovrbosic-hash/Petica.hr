import type { Metadata } from "next";
import Link from "next/link";
import { publicSearch } from "@/lib/seo";
import { subjectBySlug } from "@/lib/subjects";
import { MAJOR_CITIES } from "@/lib/cities";
import { TutorCard } from "@/components/TutorCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Priprema za državnu maturu — instruktori za matematiku, hrvatski, engleski",
  description:
    "Instrukcije za državnu maturu: matematika (A i B), hrvatski jezik i esej, engleski, fizika, kemija, biologija. Uživo ili online, u cijeloj Hrvatskoj.",
  alternates: { canonical: "/priprema-za-maturu" },
};

const MATURA_SUBJECTS = ["matematika", "hrvatski-jezik", "engleski-jezik", "njemacki-jezik", "fizika", "kemija", "biologija", "povijest", "geografija", "informatika", "latinski-jezik", "filozofija"];

export default async function MaturaPage() {
  const tutors = await publicSearch({ p_level: "matura", p_limit: 12 });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-2xl bg-brand-700 p-6 text-white sm:p-8">
        <p className="text-xs font-bold tracking-wider text-gold-400 uppercase">Istaknuta kategorija</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Priprema za državnu maturu</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          Instruktori koji znaju kako izgleda ispit: rješavanje starih ispita, strategija, esej, A i B razina. Počnite na
          vrijeme — najbolji termini se popune do proljeća.
        </p>
      </div>

      <h2 className="mt-8 text-xl font-bold">Odaberite predmet</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {MATURA_SUBJECTS.map((slug) => {
          const s = subjectBySlug(slug)!;
          return (
            <Link key={slug} href={`/pretraga?predmet=${slug}&razina=matura`} className="card flex items-center gap-2 p-3 text-sm font-semibold hover:border-brand-300">
              {s.name}
            </Link>
          );
        })}
      </div>

      <h2 className="mt-8 text-xl font-bold">Instruktori za maturu</h2>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        {tutors.map((t) => (
          <TutorCard key={t.id} t={t} />
        ))}
      </div>
      {tutors.length === 0 && <p className="mt-2 text-sm text-slate-600">Uskoro.</p>}

      <h2 className="mt-8 text-xl font-bold">Matura po gradovima</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {MAJOR_CITIES.map((c) => (
          <Link key={c} className="chip py-1.5 hover:bg-brand-100" href={`/pretraga?razina=matura&grad=${encodeURIComponent(c)}`}>{c}</Link>
        ))}
      </div>
    </div>
  );
}
