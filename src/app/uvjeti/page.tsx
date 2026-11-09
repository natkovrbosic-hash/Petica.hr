import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, owner } from "@/components/LegalPage";
import { FEATURED_PRICE_EUR, SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Uvjeti korištenja", alternates: { canonical: "/uvjeti" } };

export default function TermsPage() {
  return (
    <LegalPage title="Uvjeti korištenja" updated="[datum]">
      <h2>1. O platformi</h2>
      <p>
        Instrukcije24.hr je internetska platforma na kojoj instruktori objavljuju oglase (profile) za instrukcije, a roditelji i
        učenici ih pretražuju i s njima komuniciraju porukama. Platformom upravlja {owner()} („Instrukcije24.hr”, „mi”).
      </p>
      <p>
        <strong>Instrukcije24.hr samo prodaje oglasni prostor.</strong> Nismo pružatelj instrukcija, nismo strana ugovora između
        korisnika i instruktora, ne određujemo cijene, ne naplaćujemo sate instrukcija, ne primamo niti prosljeđujemo
        novac za instrukcije i ne posredujemo u plaćanju između korisnika i instruktora. Korisnik i instruktor sve
        (termin, mjesto, cijenu, način plaćanja, otkazivanje) dogovaraju i plaćaju izravno.
      </p>

      <h2>2. Korisnički račun i dob</h2>
      <ul>
        <li>Instruktor mora imati najmanje 18 godina, što potvrđuje pri registraciji upisom datuma rođenja i izjavom.</li>
        <li>
          Korisnički račun (za traženje instruktora) može otvoriti roditelj/skrbnik ili učenik koji ima najmanje 16
          godina. Za učenike mlađe od 16 godina račun otvara i koristi roditelj ili skrbnik.
        </li>
        <li>Korisnik je dužan upisati istinite podatke i čuvati svoju lozinku. Za radnje s računa odgovara njegov vlasnik.</li>
      </ul>

      <h2>3. Instruktori — vlastita odgovornost</h2>
      <ul>
        <li>
          <strong>
            Instruktor je samostalno i isključivo odgovoran za ispunjavanje svih svojih poreznih i drugih zakonskih
            obveza
          </strong>{" "}
          u vezi s instrukcijama (npr. prijava i plaćanje poreza na dohodak, registracija djelatnosti, izdavanje računa i
          fiskalizacija kada su propisani, doprinosi). Instrukcije24.hr ne obračunava, ne zadržava niti ne uplaćuje poreze ili
          doprinose za instruktore.
        </li>
        <li>Instruktor jamči da su podaci na profilu (ime, obrazovanje, iskustvo, predmeti, cijena) istiniti i ažurni.</li>
        <li>
          Profil je vidljiv u pretrazi tek nakon što ga Instrukcije24.hr odobri. Odobrenje znači samo da profil formalno
          ispunjava uvjete, a ne jamstvo kvalitete instrukcija ni provjeru kvalifikacija.
        </li>
        <li>Instruktor koristi podatke korisnika (ime, poruke) samo za dogovor o instrukcijama.</li>
      </ul>

      <h2>4. Dogovor i plaćanje instrukcija</h2>
      <p>
        Cijena na profilu je informativna i određuje je instruktor. Plaćanje instrukcija ide izravno od korisnika
        instruktoru, izvan platforme. Instrukcije24.hr ne odgovara za izvršenje dogovora, kvalitetu instrukcija, plaćanje,
        otkazivanje ili povrat novca. Nikad ne tražimo da nam uplatite novac za instrukcije — prijavite svaki takav
        zahtjev na {SUPPORT_EMAIL}.
      </p>
      <p className="text-sm text-slate-500">
        [Napomena za pravnika: model je osmišljen tako da platforma ne posreduje u plaćanju naknade za usluge
        (Direktiva DAC7 / Zakon o administrativnoj suradnji u području poreza). Provjeriti smatra li se Instrukcije24.hr
        „operaterom platforme” s obvezom izvješćivanja te uskladiti tekst.]
      </p>

      <h2>4a. Rezervacija termina i hitne instrukcije</h2>
      <ul>
        <li>
          Instruktor određuje tjednu dostupnost, trajanje sata i minimalnu najavu. Korisnik može rezervirati slobodan
          termin koji platforma automatski izračuna iz tih postavki; rezervacija je potvrđena odmah i obje strane dobivaju
          obavijest.
        </li>
        <li>
          Opcijom hitne dostupnosti instruktor označava da je dostupan za hitne instrukcije u navedenom razdoblju, i izvan
          redovne dostupnosti.
        </li>
        <li>
          Rezervacija je dogovor korisnika i instruktora. Instrukcije24.hr ne naplaćuje termin, ne jamči da će se instrukcija
          održati i ne odgovara za otkazivanje ili nedolazak. Termin mogu otkazati obje strane u „Termini”; uvjete
          otkazivanja (npr. naknadu za kasno otkazivanje) dogovaraju izravno.
        </li>
      </ul>

      <h2>5. Istaknuti profil (pretplata za instruktore)</h2>
      <ul>
        <li>Osnovni profil instruktora je besplatan.</li>
        <li>
          „Istaknuti profil” je plaćeni oglasni prostor: prikaz na vrhu rezultata pretrage i oznaka „Istaknuto”. Cijena
          iznosi {FEATURED_PRICE_EUR} € mjesečno (s PDV-om, ako je primjenjiv [provjeriti]), plaća se preko pružatelja
          platnih usluga Stripe i automatski se obnavlja svaki mjesec dok je instruktor ne otkaže.
        </li>
        <li>
          Pretplatu je moguće otkazati u svakom trenutku („Moj profil → Upravljaj pretplatom”); istaknutost traje do kraja
          plaćenog mjeseca, a za započeti mjesec novac se ne vraća [provjeriti s pravnikom — pravo na odustanak potrošača].
        </li>
        <li>
          U razdoblju lansiranja Instrukcije24.hr može ponuditi istaknuti profil bez naknade; po isteku tog razdoblja ništa se ne
          naplaćuje automatski.
        </li>
        <li>O promjeni cijene obavještavamo emailom najmanje 30 dana unaprijed.</li>
      </ul>

      <h2>6. Rangiranje rezultata</h2>
      <p>
        Istaknuti profili prikazuju se prvi i jasno su označeni kao plaćeni. Ostali rezultati poredani su prema
        sortiranju koje korisnik odabere; zadano sortiranje „Preporučeno” uzima u obzir prosječnu ocjenu i broj
        recenzija, a zatim datum odobrenja profila. Kod pretrage po gradu uzima se u obzir udaljenost.
      </p>

      <h2>7. Recenzije</h2>
      <p>
        Recenziju instruktoru može ostaviti samo korisnik koji je s njim razmijenio poruke na platformi. Recenzije moraju
        biti istinite, pristojne i bez osobnih podataka. Instrukcije24.hr može sakriti ili ukloniti recenziju koja krši ove
        uvjete. Instruktori ne smiju pisati recenzije sami sebi ni plaćati za recenzije.
      </p>

      <h2>8. Zabranjeno ponašanje i sigurnost</h2>
      <ul>
        <li>Zabranjeno je lažno predstavljanje, uznemiravanje, spam, neprimjeren sadržaj i svako protuzakonito postupanje.</li>
        <li>
          Posebno je zabranjeno svako ponašanje koje ugrožava maloljetnike. Preporučujemo da roditelji budu upoznati s
          dogovorom i da prve instrukcije s maloljetnikom budu online ili uz prisutnost roditelja.
        </li>
        <li>Instrukcije24.hr može ograničiti ili blokirati račun koji krši ove uvjete.</li>
      </ul>

      <h2>9. Prijava nezakonitog sadržaja</h2>
      <p>
        Sadržaj (profil, recenziju, poruku) možete prijaviti gumbom „Prijavi” ili na {SUPPORT_EMAIL}. Prijave
        pregledavamo bez odgode i o odluci obavještavamo prijavitelja i, kad je to primjenjivo, autora sadržaja s
        obrazloženjem [uskladiti s Aktom o digitalnim uslugama].
      </p>

      <h2>10. Odgovornost</h2>
      <p>
        Platformu pružamo „kakva jest”. U mjeri dopuštenoj propisima Instrukcije24.hr ne odgovara za instrukcije, sadržaj koji
        objavljuju korisnici ni štetu nastalu iz odnosa korisnika i instruktora.
      </p>

      <h2>11. Brisanje računa</h2>
      <p>
        Račun možete obrisati u svakom trenutku u „Moj račun”. Brisanjem se otkazuje i pretplata. Vidi{" "}
        <Link className="link" href="/privatnost">Politiku privatnosti</Link>.
      </p>

      <h2>12. Izmjene i mjerodavno pravo</h2>
      <p>
        O bitnim izmjenama uvjeta obavještavamo na platformi ili emailom. Na ove uvjete primjenjuje se pravo Republike
        Hrvatske. Potrošači mogu koristiti i izvansudsko rješavanje sporova.
      </p>
    </LegalPage>
  );
}
