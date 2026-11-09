import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
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

  const toggle = (patch: Partial<typeof effective>) => `/pretraga?${filtersToQuery({ ...effective, ...patch, str: 1 })}`;
  const quick = [
    { label: "Hitno", on: effective.hitno, href: toggle({ hitno: !effective.hitno }), icon: true },
    { label: "Matura", on: effective.razina === "matura", href: toggle({ razina: effective.razina === "matura" ? null : "matura" }) },
    {
      label: "Dolazi kući",
      on: effective.nacin.includes("dolazim"),
      href: toggle({ nacin: effective.nacin.includes("dolazim") ? effective.nacin.filter((m) => m !== "dolazim") : [...effective.nacin, "dolazim"] }),
    },
    {
      label: "Online",
      on: effective.nacin.includes("online"),
      href: toggle({ nacin: effective.nacin.includes("online") ? effective.nacin.filter((m) => m !== "online") : [...effective.nacin, "online"] }),
    },
  ];

  return (
    <div>
      <div className="rounded-b-[24px] bg-board text-chalk">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-5">
          <h1 className="font-display text-[28px] leading-tight font-extrabold sm:text-4xl">
            {effective.hitno && <span className="text-gold-400">Hitno · </span>}
            {title}
          </h1>
          <p className="mt-1 text-sm text-brand-100">
            {total === 1 ? "1 instruktor" : `${total} instruktora`}
            {effective.grad ? ` u krugu ${effective.radijus} km` : ""}
            {effective.hitno ? " · slobodni sada ili u sljedeća 24 sata" : ""}
          </p>
          <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {quick.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                aria-pressed={q.on}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${q.on ? "bg-gold-400 text-board" : "border-[1.5px] border-chalk/45 text-chalk hover:bg-white/10"}`}
              >
                {q.icon && <Zap className="size-3.5 fill-current" aria-hidden />}
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5">
        {f.q && (
          <div className="mb-4">
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
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
                  <ChevronLeft className="size-4" aria-hidden /> Prethodna
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-slate-600">
                {effective.str} / {pages}
              </span>
              {effective.str < pages ? (
                <Link className="btn-secondary btn-sm" href={`/pretraga?${filtersToQuery({ ...effective, str: effective.str + 1 })}`}>
                  Sljedeća <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
          <p className="pt-2 text-xs text-slate-500">
            Istaknuti profili (oznaka „Istaknuto”) plaćaju oglasni prostor i prikazuju se na vrhu rezultata. Uz svaki profil je prvi slobodni termin za rezervaciju. Ostali su poredani
            prema odabranom sortiranju; „Preporučeno” uzima u obzir prosječnu ocjenu i broj recenzija.
          </p>
        </section>
      </div>
      </div>
    </div>
  );
}
