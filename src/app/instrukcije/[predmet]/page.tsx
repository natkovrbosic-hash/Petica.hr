import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS, subjectBySlug } from "@/lib/subjects";
import { CITIES, citySlug } from "@/lib/cities";
import { averagePrice, majorCities, publicSearch, subjectCityCounts } from "@/lib/seo";
import { TutorCard } from "@/components/TutorCard";

export const revalidate = 3600;
export const generateStaticParams = () => SUBJECTS.map((s) => ({ predmet: s.slug }));
export const dynamicParams = false;

type Params = { params: Promise<{ predmet: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const s = subjectBySlug((await params).predmet);
  if (!s) return {};
  return {
    title: `Instrukcije iz ${s.genitive} — instruktori u cijeloj Hrvatskoj i online`,
    description: `Pronađite instruktora ${s.genitive} za osnovnu i srednju školu, državnu maturu ili fakultet. Uživo, kod kuće ili online. Usporedite cijene i recenzije.`,
    alternates: { canonical: `/instrukcije/${s.slug}` },
  };
}

export default async function SubjectPage({ params }: Params) {
  const s = subjectBySlug((await params).predmet);
  if (!s) notFound();
  const [tutors, online, counts] = await Promise.all([
    publicSearch({ p_subject: s.slug, p_limit: 12 }),
    publicSearch({ p_subject: s.slug, p_modes: ["online"], p_limit: 6 }),
    subjectCityCounts(),
  ]);
  const cityCounts = new Map(counts.filter((c) => c.subject === s.slug).map((c) => [c.city, c.n]));
  const cities = [...new Set([...majorCities().map((c) => c.name), ...cityCounts.keys()])]
    .map((name) => CITIES.find((c) => c.name === name))
    .filter((c): c is (typeof CITIES)[number] => Boolean(c))
    .sort((a, b) => (cityCounts.get(b.name) ?? 0) - (cityCounts.get(a.name) ?? 0) || a.name.localeCompare(b.name, "hr"));
  const avg = averagePrice(tutors);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-xs text-slate-500">
        <Link href="/instrukcije" className="hover:underline">Instrukcije</Link> › {s.name}
      </nav>
      <h1 className="mt-2 text-3xl font-extrabold">
        Instrukcije iz {s.genitive}
      </h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Instruktori {s.genitive} za osnovnu i srednju školu, pripremu za državnu maturu i fakultet — uživo, s dolaskom
        kući ili online.{avg ? ` Prosječna cijena na Petica.hr: oko ${avg} € po satu.` : ""} Termin i cijenu dogovarate
        izravno s instruktorom.
      </p>

      <h2 className="mt-8 text-xl font-bold">Odaberite grad</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {cities.map((c) => (
          <Link key={c.name} href={`/instrukcije/${s.slug}/${citySlug(c.name)}`} className="chip py-1.5 text-sm hover:bg-brand-100">
            {c.name}
            {cityCounts.get(c.name) ? <span className="text-brand-700"> ({cityCounts.get(c.name)})</span> : null}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">Instruktori {s.genitive}</h2>
          <div className="mt-3 space-y-3">
            {tutors.length === 0 && <p className="text-sm text-slate-600">Uskoro — budite prvi instruktor za ovaj predmet!</p>}
            {tutors.map((t) => (
              <TutorCard key={t.id} t={t} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold">Online instrukcije iz {s.genitive}</h2>
          <div className="mt-3 space-y-3">
            {online.length === 0 && <p className="text-sm text-slate-600">Trenutno nema online instruktora.</p>}
            {online.map((t) => (
              <TutorCard key={t.id} t={t} />
            ))}
          </div>
          <Link href={`/pretraga?predmet=${s.slug}`} className="btn-primary mt-4">Svi instruktori {s.genitive}</Link>
        </section>
      </div>
    </div>
  );
}
