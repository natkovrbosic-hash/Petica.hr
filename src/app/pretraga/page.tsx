import type { Metadata } from "next";
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { TutorCard } from "@/components/TutorCard";
import { Notice } from "@/components/ui";
import { PAGE_SIZE, filtersToQuery, parseFilters, runSearch } from "@/lib/search";
import { levelById, subjectBySlug } from "@/lib/subjects";

export const metadata: Metadata = {
  title: "Pretraga instruktora",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseFilters(await searchParams);
  const { results, total, detected, effective, error } = await runSearch(f);
  const subject = subjectBySlug(effective.predmet);
  const pages = Math.ceil(total / PAGE_SIZE);

  const title = [
    subject ? `Instrukcije iz ${subject.genitive}` : "Instruktori",
    effective.razina ? levelById(effective.razina)?.name : null,
    effective.grad ?? effective.zupanija,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {total === 1 ? "1 instruktor" : `${total} instruktora`}
        {effective.grad ? ` u krugu ${effective.radijus} km` : ""}
      </p>

      {f.q && (
        <div className="mt-3">
          <Notice>
            {detected.length > 0 ? (
              <>
                Za „{f.q}” prepoznali smo predmet <strong>{subjectBySlug(detected[0].subject)?.name}</strong>.
                {detected.length > 1 && (
                  <>
                    {" "}Možda ste mislili:{" "}
                    {detected.slice(1).map((d, i) => (
                      <span key={d.subject}>
                        {i > 0 && ", "}
                        <Link className="link" href={`/pretraga?${filtersToQuery({ ...f, q: "", predmet: d.subject })}`}>
                          {subjectBySlug(d.subject)?.name}
                        </Link>
                      </span>
                    ))}
                    ?
                  </>
                )}
              </>
            ) : (
              <>Nismo prepoznali predmet za „{f.q}” — odaberite ga u filterima.</>
            )}
          </Notice>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside>
          <SearchFilters f={effective} />
        </aside>
        <section aria-label="Rezultati" className="space-y-3">
          {error && <Notice kind="error">{error}</Notice>}
          {!error && results.length === 0 && (
            <div className="card p-6 text-center">
              <p className="font-semibold">Nema instruktora za odabrane filtere.</p>
              <p className="mt-1 text-sm text-slate-600">
                Pokušajte povećati udaljenost, ukloniti dio filtera ili uključiti online instrukcije.
              </p>
              <Link
                className="btn-secondary btn-sm mt-3"
                href={`/pretraga?${filtersToQuery({ ...effective, nacin: ["online"], grad: null, zupanija: null, str: 1 })}`}
              >
                Prikaži online instruktore
              </Link>
            </div>
          )}
          {results.map((t) => (
            <TutorCard key={t.id} t={t} />
          ))}
          {pages > 1 && (
            <nav className="flex items-center justify-between pt-2" aria-label="Stranice">
              {effective.str > 1 ? (
                <Link className="btn-secondary btn-sm" href={`/pretraga?${filtersToQuery({ ...effective, str: effective.str - 1 })}`}>
                  ← Prethodna
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-slate-600">
                {effective.str} / {pages}
              </span>
              {effective.str < pages ? (
                <Link className="btn-secondary btn-sm" href={`/pretraga?${filtersToQuery({ ...effective, str: effective.str + 1 })}`}>
                  Sljedeća →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
          <p className="pt-2 text-xs text-slate-500">
            Istaknuti profili (oznaka ★) plaćaju oglasni prostor i prikazuju se na vrhu rezultata. Ostali su poredani
            prema odabranom sortiranju; „Preporučeno” uzima u obzir prosječnu ocjenu i broj recenzija.
          </p>
        </section>
      </div>
    </div>
  );
}
