# Petica.hr

Platforma koja povezuje instruktore s učenicima i roditeljima u Hrvatskoj. Princip je kao kod Cehovi.hr:
platforma **samo prodaje oglasni prostor**. Ne naplaćuje sate instrukcija i ne posreduje u plaćanju između
učenika i instruktora (zbog DAC7). Jedina naplata je opcionalni „Istaknuti profil” za instruktore.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind 4, Supabase (Auth, Postgres + RLS, Realtime, Storage),
Stripe Billing. Cijeli UI je na hrvatskom i prilagođen mobitelu.

Plan, shema baze i popis stranica: [docs/PLAN.md](docs/PLAN.md).

**Rezervacija termina:** instruktor u „Moj profil” upisuje tjednu dostupnost (radno vrijeme), trajanje sata i
minimalnu najavu. Baza iz toga automatski računa slobodne termine (`free_slots`) i oduzima već rezervirane.
Učenik na profilu instruktora odabere dan i termin i rezervacija je odmah potvrđena (`book_lesson`). Preklapanja
sprječava ograničenje u bazi, i kod istovremenih rezervacija. Obje strane vide termine u `/termini`, mogu ih
otkazati i dobivaju email. Plaćanje je i dalje izravno.

**Hitne instrukcije:** instruktor uključi „Slobodan sam sada” (2 h, 4 h ili do kraja dana). Tada se pojavljuje
pod „Hitno”, a termini se nude odmah, i izvan radnog vremena i bez najave. Filter „Hitno” prikazuje
instruktore koji su slobodni sada ili imaju slobodan termin u sljedeća 24 sata.

**Dizajn:** „Školska ploča” — tamnozelena ploča, kreda, žuti naglasak. Fontovi Bricolage Grotesque i Inter
(lokalno, `@fontsource`), ikone `lucide-react`, bez emojija.

## Pokretanje lokalno

Treba: Node.js 20.9+ i Docker (za lokalni Supabase).

```bash
npm install
npm run db:start                 # lokalni Supabase: migracija + testni podaci (supabase/seed.sql)
npx supabase status -o env       # API_URL, ANON_KEY, SERVICE_ROLE_KEY
cp .env.example .env.local       # upišite te tri vrijednosti
npm run dev                      # http://localhost:3000
```

Mailpit (emailovi za potvrdu registracije i novu lozinku): http://127.0.0.1:54324

### Testni računi (lozinka za sve: `Test1234!`)

| Email | Uloga |
|---|---|
| `admin@petica.test` | admin |
| `ucenik@petica.test` | učenik (ima razgovor i recenziju s Anom) |
| `roditelj@petica.test` | roditelj (ima razgovor s Ivanom) |
| `ana@petica.test`, `ivan@petica.test`, `marko@petica.test`… | instruktori (11 odobrenih) |
| `filip@petica.test` | instruktor koji čeka odobrenje |
| `josip@petica.test` | instruktor „Slobodan sada” (hitno) |

Svi testni profili imaju `is_test = true`, oznaku **TESTNI PROFIL** i „(TEST)” u imenu. Ne indeksiraju se i nisu
u sitemapu. Brisanje na produkciji: `delete from auth.users where email like '%@petica.test';`

## Testovi

```bash
npm test             # jedinični: prepoznavanje problema → predmet, razine, gradovi, dob
npm run db:reset     # svježa baza + seed
npm run db:test      # sigurnosna pravila (RLS): uloge, odobrenje, recenzije samo nakon poruka, provjera dobi, pretraga
npm run typecheck && npm run lint && npm run build
```

`npm run db:test` radi i bez Dockera, na običnom PostgreSQL-u:
`STUB=1 PGHOST=… PGPORT=… PGUSER=postgres npm run db:test`.

## Naplata (Stripe)

- Bez `STRIPE_SECRET_KEY` pretplata radi u **testnom načinu**: klik na „Istakni profil” simulira mjesec dana.
- S ključem: Stripe Checkout (pretplata), Customer Portal (kartica, računi, otkaz) i webhook
  `/api/stripe/webhook` s događajima `checkout.session.completed` i `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`.
  Lokalno: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- Cijena: `NEXT_PUBLIC_FEATURED_PRICE_EUR` (5–9 €). Može se zadati i postojeći `STRIPE_PRICE_ID`.
- Načini plaćanja (kartica, Apple Pay / Google Pay, PayPal gdje je dostupan) uključuju se u Stripe Dashboardu →
  Settings → Payment methods. Kod ih ne ograničava.
- **Besplatno razdoblje lansiranja** (feature flag): `NEXT_PUBLIC_LAUNCH_PROMO=true`, `NEXT_PUBLIC_LAUNCH_DATE`,
  `NEXT_PUBLIC_LAUNCH_PROMO_MONTHS=3`. Dok traje, instruktor istaknuti profil uključuje besplatno, bez kartice.
  Nakon toga se ništa ne naplaćuje automatski.

## Prvi admin na produkciji

```sql
update public.profiles set role = 'admin'
 where id = (select id from auth.users where email = 'vas@email.hr');
```

## Objava (produkcija)

1. Supabase projekt (regija EU): `npx supabase link` i `npx supabase db push` (bez seeda).
   U Auth → URL Configuration postavite Site URL i redirect `https://petica.hr/**`. Uključite potvrdu emaila i SMTP.
2. Hosting (npr. Vercel): varijable iz `.env.example`.
3. Stripe webhook prema `https://petica.hr/api/stripe/webhook`.
4. **Pravne stranice (`/uvjeti`, `/privatnost`, `/kolacici`) su NACRTI i mora ih pregledati pravnik.**

## Što još nije napravljeno

- SMS obavijesti: `sendSms` u `src/lib/notify.ts` je TODO.
- Podsjetnik emailom prije isteka besplatnog razdoblja lansiranja (cron).
- Prijava pojedine poruke iz razgovora: baza i admin to podržavaju, gumba u chatu još nema.
- Profil instruktora nakon prvog odobrenja mijenja se bez ponovnog pregleda.
