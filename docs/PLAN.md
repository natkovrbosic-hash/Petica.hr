# Instrukcije24.hr — plan

Marketplace koji povezuje instruktore s učenicima i roditeljima. Platforma **ne** posreduje u plaćanju sati
(dogovor i plaćanje su izravni, zbog DAC7); naplaćuje se samo opcionalni „Istaknuti profil” instruktoru.

Iz Cehovi.hr (`ceh24.`) preuzeto: popis gradova sa županijama i koordinatama (`places.json`), normalizacija
naziva i slugovi, udaljenost (haversine), mehanizam prepoznavanja problema iz teksta (pravila s
bodovima, bez AI-ja), struktura Uvjeta korištenja i Politike privatnosti, obrazac pretplate (Stripe Checkout,
Customer Portal, webhook, testni način bez ključeva). Stack je drugačiji (Next.js + Supabase umjesto
Vite + Express + Prisma), pa su komponente napisane iznova.

## Shema baze (Supabase Postgres, sve tablice s RLS)

| Tablica | Što drži |
|---|---|
| `profiles` | 1:1 s `auth.users`: uloga (`korisnik` / `instruktor` / `admin`), ime, datum rođenja, email obavijesti, `is_test` |
| `tutors` | profil instruktora: slug, status odobrenja, naslov, opis, slika, predmeti[], razine[], načini[], cijena €/h, grad, županija, lat/lng, radijus dolaska, iskustvo, `featured_until`, prosjek ocjena, `is_test` |
| `availability` | tjedna dostupnost: dan (1–7), od, do |
| `conversations` | jedan razgovor po paru korisnik ↔ instruktor |
| `messages` | poruke (Realtime), `read_at` |
| `reviews` | ocjena 1–5 + tekst; INSERT dopušten samo ako su obje strane poslale poruku (`can_review()`) |
| `favorites` | korisnik ↔ instruktor |
| `reports` | prijave recenzija / profila / poruka |
| `bookings` | rezervirani termini (potvrđen / otkazan), bez preklapanja (exclusion constraint) |
| `subscriptions` | Stripe pretplata „Istaknuti profil” (piše je samo webhook) |

Ključne funkcije: `search_tutors(...)` (filteri + udaljenost + sortiranje, istaknuti prvi),
`handle_new_user()` (trigger: profil + provjera dobi 18+/16+), `can_review()`, `my_conversations()`,
`mark_conversation_read()`, `is_admin()`.

## Stranice

- `/` — tražilica (predmet, grad, „opiši problem”), istaknuta „Priprema za maturu”, popularni predmeti
- `/pretraga` — rezultati s filterima (predmet, razina, županija/grad, udaljenost, način, cijena, dostupnost)
- `/instruktor/[slug]` — javni profil (kalendar dostupnosti, recenzije, „Pošalji poruku”, favorit, prijava)
- `/instrukcije/[predmet]` i `/instrukcije/[predmet]/[grad]` — SEO stranice (+ `sitemap.xml`, `robots.txt`)
- `/priprema-za-maturu`
- `/prijava`, `/registracija`, `/zaboravljena-lozinka`, `/auth/callback`
- `/poruke`, `/poruke/[id]` — real-time poruke
- `/termini` — nadolazeći i prošli termini, otkazivanje
- `/moj-racun` — podaci, obavijesti, favoriti, izvoz podataka, brisanje računa
- `/moj-profil` — uređivanje profila instruktora, dostupnost, slika, „Istaknuti profil” (Stripe)
- `/admin` — profili na čekanju, recenzije, prijave, pretplate
- `/uvjeti`, `/privatnost`, `/kolacici` — nacrti (pregled pravnika!)

## Redoslijed

1. **MVP** — registracija/prijava, profil instruktora, pretraga s filterima, profil stranica, poruke
2. Recenzije, favoriti, email obavijesti (SMS = TODO)
3. Stripe pretplata „Istaknuti profil” + feature flag besplatnog razdoblja
4. Admin panel
5. SEO stranice, sitemap, pravne stranice, privola za kolačiće
