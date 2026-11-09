import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, owner } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Politika privatnosti", alternates: { canonical: "/privatnost" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politika privatnosti" updated="[datum]">
      <h2>1. Voditelj obrade</h2>
      <p>{owner()}. Kontakt za pitanja o osobnim podacima: {SUPPORT_EMAIL} [po potrebi: službenik za zaštitu podataka].</p>

      <h2>2. Koje podatke obrađujemo</h2>
      <ul>
        <li><strong>Račun:</strong> ime i prezime, email, lozinka (samo kriptografski sažetak), uloga.</li>
        <li><strong>Datum rođenja:</strong> isključivo radi provjere dobi (instruktor 18+, korisnik 16+). Ne prikazuje se javno.</li>
        <li>
          <strong>Profil instruktora (javno):</strong> ime na profilu, fotografija, opis, predmeti, razine, cijena, način
          održavanja, grad i županija, dostupnost, iskustvo, ocjene.
        </li>
        <li><strong>Poruke:</strong> sadržaj razgovora između korisnika i instruktora.</li>
        <li><strong>Termini:</strong> rezervirani termini, način održavanja, napomena i razlog otkazivanja.</li>
        <li><strong>Recenzije, favoriti i prijave.</strong></li>
        <li>
          <strong>Pretplata instruktora:</strong> status i razdoblje pretplate. Podatke o kartici obrađuje isključivo
          Stripe; mi ih ne vidimo ni ne spremamo.
        </li>
        <li><strong>Tehnički podaci:</strong> IP adresa i zapisi poslužitelja radi sigurnosti.</li>
      </ul>

      <h2>3. Svrhe i pravne osnove</h2>
      <ul>
        <li>Pružanje usluge (račun, profil, pretraga, poruke, recenzije, pretplata) — izvršenje ugovora (čl. 6. st. 1. t. b GDPR-a).</li>
        <li>Provjera dobi, sigurnost, sprječavanje zlouporaba i moderiranje — legitimni interes (t. f).</li>
        <li>Čuvanje računovodstvenih zapisa o pretplatama — zakonska obveza (t. c).</li>
        <li>Email obavijesti o porukama i profilu — izvršenje ugovora; možete ih isključiti u „Moj račun”.</li>
        <li>Analitički kolačići (ako se uvedu) — samo uz privolu (t. a). Vidi <Link className="link" href="/kolacici">Kolačići</Link>.</li>
      </ul>

      <h2>4. Primatelji i izvršitelji obrade</h2>
      <p>
        Javni profil instruktora vidljiv je svima. Poruke vide samo sudionici razgovora i, radi moderiranja prijava,
        administratori. Izvršitelji obrade: Supabase (baza, prijava, pohrana — [regija EU, upisati]), [pružatelj
        smještaja, npr. Vercel], Stripe (plaćanje pretplate), Resend (slanje emailova). Ako se podaci prenose izvan EGP-a
        (npr. SAD), prijenos se temelji na standardnim ugovornim klauzulama ili okviru EU–SAD za privatnost podataka.
      </p>

      <h2>5. Koliko dugo čuvamo podatke</h2>
      <p>
        Dok je račun aktivan. Brisanjem računa trajno brišemo profil, poruke, recenzije i favorite; zapisi o plaćenim
        pretplatama čuvaju se koliko to zahtijevaju računovodstveni i porezni propisi (do 11 godina). Sigurnosne kopije
        brišu se u roku od [30] dana.
      </p>

      <h2>6. Maloljetnici</h2>
      <p>
        Uslugu samostalno mogu koristiti osobe od 16 godina. Za mlađe učenike račun otvara roditelj ili skrbnik. Ne
        prikupljamo svjesno podatke djece mlađe od 16 godina bez roditelja.
      </p>

      <h2>7. Vaša prava</h2>
      <p>
        Imate pravo na pristup i prenosivost („Moj račun → Preuzmi moje podatke”), ispravak („Moj račun”), brisanje („Moj
        račun → Obriši račun”), ograničenje obrade, prigovor i povlačenje privole. Pritužbu možete podnijeti Agenciji za
        zaštitu osobnih podataka (azop.hr).
      </p>

      <h2>8. Izmjene</h2>
      <p>O bitnim izmjenama ove politike obavijestit ćemo vas na platformi ili emailom.</p>
    </LegalPage>
  );
}
