import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SUBJECTS, subjectBySlug } from "@/lib/subjects";
import { cityBySlug, citySlug } from "@/lib/cities";
import { SITE_URL } from "@/lib/config";
import { averagePrice, isMajorCity, nearestCities, publicSearch } from "@/lib/seo";
import { TutorCard } from "@/components/TutorCard";

// SEO stranice predmet + grad (glavni kanal akvizicije). Generiraju se na zahtjev i keširaju sat vremena (ISR).
export const revalidate = 3600;
export const generateStaticParams = async () => [];

const RADIUS_KM = 20;
type Params = { params: Promise<{ predmet: string; grad: string }> };

const load = cache(async (predmet: string, grad: string) => {
  const subject = subjectBySlug(predmet);
  const city = cityBySlug(grad);
  if (!subject || !city) return null;
  const [local, online] = await Promise.all([
    publicSearch({ p_subject: subject.slug, p_lat: city.lat, p_lng: city.lng, p_radius_km: RADIUS_KM, p_limit: 30 }),
    publicSearch({ p_subject: subject.slug, p_modes: ["online"], p_limit: 12 }),
  ]);
  const localIds = new Set(local.map((t) => t.id));
  return { subject, city, local, online: online.filter((t) => !localIds.has(t.id)).slice(0, 6) };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { predmet, grad } = await params;
  const d = await load(predmet, grad);
  if (!d) return {};
  const { subject, city, local } = d;
  const n = local.length;
  return {
    title: `Instrukcije iz ${subject.genitive} ${city.name}${n ? ` — ${n} ${n === 1 ? "instruktor" : "instruktora"}` : ""}`,
    description: `Instruktori ${subject.genitive} — ${city.name} i okolica: osnovna i srednja škola, državna matura, fakultet. Uživo, kod kuće ili online. Usporedite cijene, recenzije i termine.`,
    alternates: { canonical: `/instrukcije/${subject.slug}/${citySlug(city.name)}` },
    // stranice bez lokalnih instruktora u manjim mjestima ne indeksiramo (tanak sadržaj)
    robots: n > 0 || isMajorCity(city.name) ? undefined : { index: false, follow: true },
  };
}

export default async function SubjectCityPage({ params }: Params) {
  const { predmet, grad } = await params;
  const d = await load(predmet, grad);
  if (!d) notFound();
  const { subject: s, city, local, online } = d;
  const avg = averagePrice(local) ?? averagePrice(online);
  const nearby = nearestCities(city, 8);
  const pretraga = `/pretraga?predmet=${s.slug}&grad=${encodeURIComponent(city.name)}`;

  const faq = [
    {
      q: `Koliko koštaju instrukcije iz ${s.genitive} — ${city.name}?`,
      a: avg
        ? `Instruktori ${s.genitive} na Instrukcije24.hr${local.length ? ` u okolici (${city.name})` : ""} u prosjeku traže oko ${avg} € po satu. Cijenu određuje svaki instruktor i dogovarate je izravno s njim.`
        : `Cijenu određuje svaki instruktor; najčešće je između 10 i 25 € po satu. Dogovarate je izravno s instruktorom.`,
    },
    {
      q: "Kako se plaćaju instrukcije?",
      a: "Izravno instruktoru, na način koji dogovorite (gotovina, uplata…). Instrukcije24.hr ne naplaćuje sate instrukcija i ne uzima proviziju.",
    },
    {
      q: "Mogu li instrukcije biti online?",
      a: `Da. Mnogi instruktori ${s.genitive} rade online, pa možete učiti s instruktorom iz bilo kojeg grada.`,
    },
    {
      q: "Imate li instruktore za državnu maturu?",
      a: `Da — u filterima odaberite razinu „Državna matura” ili pogledajte stranicu Priprema za maturu.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Instrukcije", item: `${SITE_URL}/instrukcije` },
        { "@type": "ListItem", position: 2, name: s.name, item: `${SITE_URL}/instrukcije/${s.slug}` },
        { "@type": "ListItem", position: 3, name: city.name, item: `${SITE_URL}/instrukcije/${s.slug}/${citySlug(city.name)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: local.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/instruktor/${t.slug}`, name: t.display_name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs text-slate-500">
        <Link href="/instrukcije" className="hover:underline">Instrukcije</Link> ›{" "}
        <Link href={`/instrukcije/${s.slug}`} className="hover:underline">{s.name}</Link> › {city.name}
      </nav>
      <h1 className="mt-2 text-[32px] leading-tight sm:text-[40px]">
        Instrukcije iz {s.genitive}
        <span className="block text-slate-600">{city.name} i okolica</span>
      </h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        {local.length > 0
          ? `${local.length} ${local.length === 1 ? "instruktor" : "instruktora"} ${s.genitive} — ${city.name} i okolica do ${RADIUS_KM} km (${city.county}).`
          : `Trenutno nema instruktora ${s.genitive} s lokacijom ${city.name} ili u okolici — ali online instruktori dostupni su odmah.`}{" "}
        Usporedite cijene, razine i recenzije te se instruktoru javite porukom. Dogovor i plaćanje su izravni, bez provizije.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={pretraga} className="btn-primary btn-sm">Dodatni filtri (razina, cijena, termin)</Link>
        <Link href={`${pretraga}&razina=matura`} className="btn-secondary btn-sm">Za maturu</Link>
        <Link href={`${pretraga}&nacin=dolazim`} className="btn-secondary btn-sm">Dolazak kući</Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Instruktori u blizini</h2>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
          {local.map((t) => (
            <TutorCard key={t.id} t={t} />
          ))}
        </div>
        {local.length === 0 && (
          <p className="mt-2 text-sm text-slate-600">
            Držite instrukcije iz {s.genitive}? <Link className="link" href="/registracija?uloga=instruktor">Napravite besplatan profil</Link>.
          </p>
        )}
      </section>

      {online.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Online instruktori {s.genitive}</h2>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            {online.map((t) => (
              <TutorCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Česta pitanja</h2>
        <div className="mt-3 space-y-2">
          {faq.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-bold">Isti predmet u okolnim mjestima</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {nearby.map((c) => (
              <li key={c.name}>
                <Link className="chip py-1.5 hover:bg-brand-100" href={`/instrukcije/${s.slug}/${citySlug(c.name)}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold">Drugi predmeti, {city.name}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SUBJECTS.filter((x) => x.slug !== s.slug).slice(0, 12).map((x) => (
              <li key={x.slug}>
                <Link className="chip py-1.5 hover:bg-brand-100" href={`/instrukcije/${x.slug}/${citySlug(city.name)}`}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
