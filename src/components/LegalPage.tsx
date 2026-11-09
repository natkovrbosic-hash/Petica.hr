import { COMPANY, SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";

export function owner() {
  const name = COMPANY.name || "[naziv vlasnika platforme]";
  return `${name}${COMPANY.oib ? `, OIB ${COMPANY.oib}` : ", OIB [upisati]"}${COMPANY.address ? `, ${COMPANY.address}` : ", [adresa]"}`;
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-md border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>NACRT — nije pravni savjet.</strong> Ovaj tekst je predložak za {SITE_NAME} i prije objave ga mora
        pregledati i prilagoditi pravnik (posebno dijelove o DAC7, porezima, GDPR-u, Zakonu o zaštiti potrošača i Aktu o
        digitalnim uslugama). Podatke u [uglatim zagradama] treba upisati.
      </div>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">Posljednja izmjena: {updated}. Kontakt: {SUPPORT_EMAIL}</p>
      <div className="prose-legal mt-4">{children}</div>
    </div>
  );
}
