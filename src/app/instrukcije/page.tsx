import type { Metadata } from "next";
import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { citySlug, MAJOR_CITIES } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Instrukcije po predmetima i gradovima",
  description: "Instrukcije iz matematike, jezika, fizike, kemije i drugih predmeta u svim gradovima Hrvatske i online.",
  alternates: { canonical: "/instrukcije" },
};

export default function InstrukcijeIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Instrukcije po predmetima i gradovima</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <section key={s.slug} className="card p-4">
            <h2 className="font-bold">
              <Link href={`/instrukcije/${s.slug}`} className="hover:text-brand-700">
                {s.emoji} Instrukcije iz {s.genitive}
              </Link>
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
              {MAJOR_CITIES.slice(0, 10).map((c) => (
                <li key={c}>
                  <Link className="hover:text-brand-700" href={`/instrukcije/${s.slug}/${citySlug(c)}`}>{c}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
