import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { citySlug } from "@/lib/cities";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/config";
import { CookieSettingsLink } from "./CookieConsent";

const FOOTER_CITIES = ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Varaždin"];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold text-slate-900">{SITE_NAME}</p>
          <p className="mt-2 text-slate-600">
            Platforma za oglašavanje instruktora. Termin, cijenu i plaćanje dogovarate izravno s instruktorom —
            {` ${SITE_NAME}`} ne naplaćuje sate instrukcija.
          </p>
          <p className="mt-2 text-slate-600">
            Kontakt: <a className="link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-900">Popularno</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            {SUBJECTS.slice(0, 4).map((s) =>
              FOOTER_CITIES.slice(0, 2).map((c) => (
                <li key={s.slug + c}>
                  <Link className="hover:text-brand-700" href={`/instrukcije/${s.slug}/${citySlug(c)}`}>
                    Instrukcije iz {s.genitive} — {c}
                  </Link>
                </li>
              )),
            )}
            <li>
              <Link className="hover:text-brand-700" href="/priprema-za-maturu">Priprema za državnu maturu</Link>
            </li>
            <li>
              <Link className="hover:text-brand-700" href="/instrukcije">Svi predmeti i gradovi</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-900">Informacije</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            <li><Link className="hover:text-brand-700" href="/za-instruktore">Za instruktore</Link></li>
            <li><Link className="hover:text-brand-700" href="/uvjeti">Uvjeti korištenja</Link></li>
            <li><Link className="hover:text-brand-700" href="/privatnost">Politika privatnosti</Link></li>
            <li><Link className="hover:text-brand-700" href="/kolacici">Kolačići</Link></li>
            <li><CookieSettingsLink /></li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} {SITE_NAME}</p>
    </footer>
  );
}
