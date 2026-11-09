import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CookieSettingsLink } from "@/components/CookieConsent";

export const metadata: Metadata = { title: "Kolačići", alternates: { canonical: "/kolacici" } };

const COOKIES = [
  ["sb-…-auth-token", "Nužan", "Prijava (Supabase) — održava vašu sesiju.", "Do odjave / 1 godina"],
  ["i24_privola", "Nužan", "Pamti vaš odabir o kolačićima.", "6 mjeseci"],
  ["Stripe (__stripe_mid, __stripe_sid)", "Nužan", "Samo na stranici plaćanja pretplate — sprječavanje prijevara.", "Do 1 godine"],
];

export default function CookiesPage() {
  return (
    <LegalPage title="Kolačići" updated="[datum]">
      <p>
        Kolačići su male datoteke koje stranica sprema u vaš preglednik. Instrukcije24.hr trenutno koristi samo nužne kolačiće,
        bez kojih prijava i plaćanje ne rade. Analitičke ili marketinške kolačiće koristit ćemo samo uz vašu privolu.
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b text-[14px] text-slate-600">
            <tr>
              <th className="py-2 pr-3">Kolačić</th>
              <th className="py-2 pr-3">Vrsta</th>
              <th className="py-2 pr-3">Svrha</th>
              <th className="py-2">Trajanje</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {COOKIES.map(([n, k, s, t]) => (
              <tr key={n}>
                <td className="py-2 pr-3 font-mono text-xs">{n}</td>
                <td className="py-2 pr-3">{k}</td>
                <td className="py-2 pr-3">{s}</td>
                <td className="py-2">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Svoj odabir možete promijeniti u svakom trenutku: <CookieSettingsLink />.
      </p>
    </LegalPage>
  );
}
