import type { Metadata } from "next";
import Link from "next/link";
import { publicSearch } from "@/lib/seo";
import { subjectBySlug } from "@/lib/subjects";
import { MAJOR_CITIES } from "@/lib/cities";
import { TutorCard } from "@/components/TutorCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Priprema za državnu maturu: matematika, hrvatski, engleski i izborni predmeti",
  description:
    "Instrukcije za državnu maturu: matematika (viša i osnovna razina), hrvatski jezik i esej, engleski, fizika, kemija, biologija. Uživo ili online, u cijeloj Hrvatskoj.",
  alternates: { canonical: "/priprema-za-maturu" },
};

const MATURA_SUBJECTS = ["matematika", "hrvatski-jezik", "engleski-jezik", "njemacki-jezik", "fizika", "kemija", "biologija", "povijest", "geografija", "informatika", "latinski-jezik", "filozofija"];

export default async function MaturaPage() {
  const tutors = await publicSearch({ p_level: "matura", p_limit: 12 });
  return (
    <div>
      <div className="bg-board text-chalk">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
          <h1 className="max-w-2xl text-[34px] leading-tight sm:text-[44px]">Priprema za državnu maturu</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-chalk/85">
            Instruktori koji pripremaju za ispite državne mature: rješavanje ispita iz prethodnih rokova, pisanje eseja i
            ponavljanje gradiva po ispitnom katalogu. Termini za proljeće popunjavaju se ranije, pa je pripremu dobro
            započeti na vrijeme.
          </p>
        </div>
        <div className="h-2.5 bg-ledge" aria-hidden />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section>
          <h2 className="border-b border-ink pb-2 text-[17px]">Predmeti</h2>
          <ul>
            {MATURA_SUBJECTS.map((slug) => (
              <li key={slug} className="border-b border-line">
                <Link href={`/pretraga?predmet=${slug}&razina=matura`} className="block py-2.5 text-[16px] hover:underline hover:underline-offset-[3px]">
                  {subjectBySlug(slug)!.name}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 border-b border-ink pb-2 text-[17px]">Gradovi</h2>
          <p className="mt-3 text-[15px] leading-relaxed">
            {MAJOR_CITIES.map((c, i) => (
              <span key={c}>
                {i > 0 && ", "}
                <Link className="underline decoration-slate-300 underline-offset-[3px] hover:decoration-ink" href={`/pretraga?razina=matura&grad=${encodeURIComponent(c)}`}>{c}</Link>
              </span>
            ))}
          </p>
        </section>
        <section>
          <h2 className="text-[22px]">Instruktori za maturu</h2>
          <div className="mt-4 space-y-3">
            {tutors.map((t) => (
              <TutorCard key={t.id} t={t} />
            ))}
          </div>
          {tutors.length === 0 && <p className="mt-2 text-[15px] text-slate-600">Još nema instruktora za maturu.</p>}
        </section>
      </div>
    </div>
  );
}
