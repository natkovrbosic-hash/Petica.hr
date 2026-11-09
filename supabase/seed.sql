-- ============================================================================
-- TESTNI PODACI — samo za lokalni razvoj i demo.
-- Svi računi imaju email @instrukcije24.test, oznaku is_test = true i „(TEST)” u imenu.
-- Lozinka za sve: Test1234!
-- Na produkciji ih obrišite: delete from auth.users where email like '%@instrukcije24.test';
-- ============================================================================

create or replace function pg_temp.seed_user(p_email text, p_name text, p_role text, p_birth date)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt('Test1234!', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('full_name', p_name, 'role', p_role, 'birth_date', p_birth),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
  update public.profiles set is_test = true where id = v_id;
  return v_id;
end;
$$;

do $$
declare
  v_admin uuid;
  v_student uuid;
  v_parent uuid;
  v_t uuid;
  v_conv uuid;
  r record;
begin
  v_admin := pg_temp.seed_user('admin@instrukcije24.test', 'Admin (TEST)', 'korisnik', '1985-01-01');
  update public.profiles set role = 'admin' where id = v_admin;

  v_student := pg_temp.seed_user('ucenik@instrukcije24.test', 'Luka Učenik (TEST)', 'korisnik', '2008-03-14');
  v_parent := pg_temp.seed_user('roditelj@instrukcije24.test', 'Marija Roditelj (TEST)', 'korisnik', '1980-06-02');

  for r in
    select * from (values
      ('ana@instrukcije24.test', 'Ana Horvat (TEST)', '1994-05-10', 'Prof. matematike — razlomci više nisu bauk',
       'Profesorica matematike s 8 godina iskustva u osnovnoj i srednjoj školi. Strpljivo, korak po korak, s puno primjera iz svakodnevnog života. Pripremam i za državnu maturu (A i B razina).',
       array['matematika', 'fizika'], array['os-5', 'os-6', 'os-7', 'os-8', 'ss', 'matura'],
       array['kod_mene', 'online'], 18, 'Zagreb', 'Grad Zagreb', 45.81306, 15.97722, 8, true, 'odobren'),
      ('ivan@instrukcije24.test', 'Ivan Kovačević (TEST)', '1990-11-22', 'Engleski za školu, maturu i Cambridge ispite',
       'Magistar anglistike, živio 4 godine u Londonu. Konverzacija, gramatika, priprema za FCE/CAE i državnu maturu.',
       array['engleski-jezik'], array['os-3', 'os-4', 'os-5', 'os-6', 'os-7', 'os-8', 'ss', 'matura', 'fakultet'],
       array['online', 'dolazim'], 20, 'Zagreb', 'Grad Zagreb', 45.80, 15.95, 10, false, 'odobren'),
      ('petra@instrukcije24.test', 'Petra Babić (TEST)', '1998-02-03', 'Hrvatski jezik i lektire bez muke',
       'Studentica kroatistike. Pomažem s lektirama, esejima, pravopisom i gramatikom. Esej za maturu — moja specijalnost.',
       array['hrvatski-jezik', 'pomoc-u-ucenju'], array['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'os-7', 'os-8', 'ss', 'matura'],
       array['kod_mene', 'dolazim', 'online'], 13, 'Split', 'Splitsko-dalmatinska županija', 43.50891, 16.43915, 3, false, 'odobren'),
      ('marko@instrukcije24.test', 'Marko Jurić (TEST)', '1987-07-19', 'Fizika i matematika za srednjoškolce i studente',
       'Diplomirani inženjer fizike. Mehanika, elektromagnetizam, termodinamika. Kolokviji i ispiti na FER-u i PMF-u.',
       array['fizika', 'matematika'], array['ss', 'matura', 'fakultet'],
       array['online', 'kod_mene'], 25, 'Rijeka', 'Primorsko-goranska županija', 45.32722, 14.44111, 12, true, 'odobren'),
      ('lucija@instrukcije24.test', 'Lucija Novak (TEST)', '1996-09-30', 'Kemija i biologija — razumjeti, ne štrebati',
       'Magistra molekularne biologije. Kemija i biologija za osnovnu i srednju školu te pripremu za maturu i prijemne.',
       array['kemija', 'biologija'], array['os-7', 'os-8', 'ss', 'matura'],
       array['online', 'dolazim'], 17, 'Osijek', 'Osječko-baranjska županija', 45.56178, 18.67641, 5, false, 'odobren'),
      ('tomislav@instrukcije24.test', 'Tomislav Marić (TEST)', '1992-04-12', 'Programiranje: Python, Java, C++',
       'Software inženjer. Učim programiranje od nule, pomažem s projektima i ispitima iz programiranja na fakultetu.',
       array['programiranje', 'informatika'], array['os-7', 'os-8', 'ss', 'fakultet'],
       array['online'], 30, 'Zagreb', 'Grad Zagreb', 45.79, 16.00, 9, false, 'odobren'),
      ('maja@instrukcije24.test', 'Maja Knežević (TEST)', '1983-12-01', 'Njemački za sve uzraste',
       'Profesorica njemačkog jezika, Goethe ispitivač. Priprema za DSD i Goethe certifikate, maturu i rad u inozemstvu.',
       array['njemacki-jezik'], array['os-4', 'os-5', 'os-6', 'os-7', 'os-8', 'ss', 'matura', 'fakultet'],
       array['kod_mene', 'online'], 16, 'Zadar', 'Zadarska županija', 44.11582, 15.22438, 15, false, 'odobren'),
      ('josip@instrukcije24.test', 'Josip Vuković (TEST)', '1999-08-08', 'Matematika za osnovnu školu',
       'Student matematike. Strpljiv sam i jasno objašnjavam — tablica množenja, razlomci, jednadžbe, priprema za ispite.',
       array['matematika', 'pomoc-u-ucenju'], array['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'os-7', 'os-8'],
       array['dolazim', 'kod_mene'], 12, 'Velika Gorica', 'Zagrebačka županija', 45.7125, 16.0756, 2, false, 'odobren'),
      ('ema@instrukcije24.test', 'Ema Pavlović (TEST)', '1991-01-25', 'Povijest i geografija — priče koje se pamte',
       'Profesorica povijesti i geografije. Pripreme za ispite, maturu i natjecanja.',
       array['povijest', 'geografija'], array['os-5', 'os-6', 'os-7', 'os-8', 'ss', 'matura'],
       array['online', 'kod_mene'], 14, 'Varaždin', 'Varaždinska županija', 46.30444, 16.33778, 7, false, 'odobren'),
      ('karlo@instrukcije24.test', 'Karlo Božić (TEST)', '1989-03-17', 'Ekonomija, računovodstvo i statistika',
       'Ekonomist, 10 godina u računovodstvu. Pomoć studentima ekonomije: mikro, makro, statistika, računovodstvo.',
       array['ekonomija', 'racunovodstvo', 'statistika', 'matematika'], array['ss', 'fakultet'],
       array['online'], 22, 'Pula', 'Istarska županija', 44.87028, 13.84556, 10, false, 'odobren'),
      ('nina@instrukcije24.test', 'Nina Grgić (TEST)', '1997-10-05', 'Talijanski i engleski uz osmijeh',
       'Prevoditeljica. Talijanski i engleski za osnovce i srednjoškolce, konverzacija za odrasle.',
       array['talijanski-jezik', 'engleski-jezik'], array['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6', 'ss'],
       array['dolazim', 'online'], 15, 'Rijeka', 'Primorsko-goranska županija', 45.34, 14.40, 4, false, 'odobren'),
      ('filip@instrukcije24.test', 'Filip Šarić (TEST)', '2000-06-21', 'Matura iz matematike — A razina',
       'Student FER-a, 5 na maturi iz matematike. Rješavamo stare ispite i učimo strategiju rješavanja.',
       array['matematika', 'fizika'], array['ss', 'matura'],
       array['online', 'kod_mene'], 15, 'Split', 'Splitsko-dalmatinska županija', 43.51, 16.47, 3, false, 'na_cekanju')
    ) as v(email, name, birth, headline, bio, subjects, levels, modes, price, city, county, lat, lng, exp, featured, status)
  loop
    v_t := pg_temp.seed_user(r.email, r.name, 'instruktor', r.birth::date);
    update public.tutors set
      headline = r.headline, bio = r.bio, subjects = r.subjects, levels = r.levels, modes = r.modes,
      price_eur = r.price, city = r.city, county = r.county, lat = r.lat, lng = r.lng,
      experience_years = r.exp, experience = 'Testni profil — iskustvo nije stvarno.',
      status = r.status::public.tutor_status, is_test = true, submitted_at = now(),
      approved_at = case when r.status = 'odobren' then now() - (random() * interval '60 days') end,
      featured_until = case when r.featured then now() + interval '30 days' end
    where id = v_t;

    insert into public.availability (tutor_id, weekday, start_time, end_time)
    select v_t, d, s, e from (values
      (1, time '16:00', time '20:00'), (2, time '14:00', time '19:00'), (3, time '16:00', time '20:00'),
      (4, time '15:00', time '19:00'), (6, time '09:00', time '13:00')) a(d, s, e)
    where (d + length(r.email)) % 3 <> 0 or d = 6;
  end loop;

  -- Rezervacije i hitno: Josip je „slobodan sada” 4 sata, Ivan traži 24 h najave i drži sat od 90 min
  update public.tutors set hitno_until = now() + interval '4 hours', booking_notice_hours = 2 where slug like 'josip-vukovic-test-%';
  update public.tutors set lesson_minutes = 90, booking_notice_hours = 24 where slug like 'ivan-kovacevic-test-%';
  update public.tutors set lesson_minutes = 45 where slug like 'petra-babic-test-%';

  -- Razgovor učenika i Ane + recenzija (dopuštena jer su obje strane poslale poruku)
  select id into v_t from public.tutors where slug like 'ana-horvat-test-%';
  insert into public.conversations (student_id, tutor_id) values (v_student, v_t) returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body, created_at) values
    (v_conv, v_student, 'Bok! Trebam pomoć s razlomcima i jednadžbama, pišem test za 2 tjedna. Imate li termin utorkom?', now() - interval '3 days'),
    (v_conv, v_t, 'Bok Luka! Može utorak u 17 h, online ili kod mene. Pošalji mi zadatke koji ti nisu jasni.', now() - interval '3 days' + interval '2 hours'),
    (v_conv, v_student, 'Super, može online. Hvala!', now() - interval '2 days');
  insert into public.reviews (tutor_id, author_id, rating, body) values
    (v_t, v_student, 5, 'Odlično objašnjava, napokon kužim razlomke. (testna recenzija)');

  select id into v_t from public.tutors where slug like 'ivan-kovacevic-test-%';
  insert into public.conversations (student_id, tutor_id) values (v_parent, v_t) returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body, created_at) values
    (v_conv, v_parent, 'Poštovani, kćer (7. razred) treba pomoć s engleskim. Dolazite li u Trešnjevku?', now() - interval '1 day'),
    (v_conv, v_t, 'Poštovana, da, dolazim. Srijedom i četvrtkom poslijepodne imam slobodnih termina.', now() - interval '20 hours');
  insert into public.reviews (tutor_id, author_id, rating, body) values
    (v_t, v_parent, 4, 'Ugodan i pouzdan, kći je zadovoljna. (testna recenzija)');
end $$;
