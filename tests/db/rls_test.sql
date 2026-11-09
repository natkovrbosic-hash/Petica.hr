-- Testovi sigurnosnih pravila (RLS, triggeri). Pokretanje: npm run test:db (treba migraciju + seed).
-- Svaki blok se izvršava kao uloga `authenticated` ili `anon` s postavljenim korisnikom (auth.uid()).
\set ON_ERROR_STOP on

create or replace function pg_temp.uid(p_email text) returns uuid language sql as
$$ select id from auth.users where email = p_email $$;

-- 1) Anonimni posjetitelj vidi samo odobrene instruktore i ne vidi profile (datum rođenja)
begin;
set local role anon;
do $$ begin
  assert (select count(*) from public.tutors) = 11, 'anon: samo odobreni instruktori';
  assert (select count(*) from public.profiles) = 0, 'anon: profili nisu javni';
  assert (select count(*) from public.messages) = 0, 'anon: poruke nisu javne';
end $$;
rollback;

-- 2) Korisnik ne može sam sebi dati ulogu admina
begin;
select set_config('request.jwt.claim.sub', pg_temp.uid('ucenik@petica.test')::text, true);
set local role authenticated;
update public.profiles set role = 'admin', full_name = 'Luka (TEST)' where id = auth.uid();
do $$ begin
  assert (select role from public.profiles where id = auth.uid()) = 'korisnik', 'uloga se ne smije promijeniti';
  assert (select full_name from public.profiles where id = auth.uid()) = 'Luka (TEST)', 'ime se smije promijeniti';
  assert (select count(*) from public.profiles) = 1, 'korisnik vidi samo svoj profil';
end $$;
rollback;

-- 3) Instruktor ne može sam sebe odobriti ni istaknuti
begin;
select set_config('request.jwt.claim.sub', pg_temp.uid('filip@petica.test')::text, true);
set local role authenticated;
update public.tutors set status = 'odobren', featured_until = now() + interval '1 year', rating_avg = 5,
                         headline = 'Novi naslov' where id = auth.uid();
do $$ begin
  assert (select status from public.tutors where id = auth.uid()) = 'na_cekanju', 'status se ne smije promijeniti';
  assert (select featured_until from public.tutors where id = auth.uid()) is null, 'istaknutost se ne smije promijeniti';
  assert (select headline from public.tutors where id = auth.uid()) = 'Novi naslov', 'naslov se smije promijeniti';
end $$;
-- ... i ne može uređivati tuđi profil
update public.tutors set headline = 'hack' where slug like 'ana-horvat%';
do $$ begin
  assert (select headline from public.tutors where slug like 'ana-horvat%') <> 'hack', 'tuđi profil';
end $$;
rollback;

-- 4) Recenzija samo nakon razmjene poruka
begin;
select set_config('request.jwt.claim.sub', pg_temp.uid('roditelj@petica.test')::text, true);
set local role authenticated;
do $$
declare v_marko uuid := (select id from public.tutors where slug like 'marko-juric%');
        v_conv uuid;
begin
  assert not public.can_review(v_marko), 'bez razgovora nema recenzije';
  begin
    insert into public.reviews (tutor_id, author_id, rating) values (v_marko, auth.uid(), 1);
    assert false, 'recenzija bez razgovora je prošla';
  exception when insufficient_privilege then null;
  end;
  insert into public.conversations (student_id, tutor_id) values (auth.uid(), v_marko) returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body) values (v_conv, auth.uid(), 'Bok');
  assert not public.can_review(v_marko), 'samo jedna strana je pisala';
end $$;
rollback;

begin;
-- instruktor odgovori → korisnik smije ocijeniti
do $$
declare v_marko uuid := (select id from public.tutors where slug like 'marko-juric%');
        v_par uuid := (select id from auth.users where email = 'roditelj@petica.test');
        v_conv uuid;
begin
  insert into public.conversations (student_id, tutor_id) values (v_par, v_marko) returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body) values (v_conv, v_par, 'Bok'), (v_conv, v_marko, 'Pozdrav');
end $$;
select set_config('request.jwt.claim.sub', pg_temp.uid('roditelj@petica.test')::text, true);
set local role authenticated;
insert into public.reviews (tutor_id, author_id, rating, body)
select id, auth.uid(), 4, 'ok' from public.tutors where slug like 'marko-juric%';
do $$ begin
  assert (select rating_count from public.tutors where slug like 'marko-juric%') = 1, 'ocjena se preračunala';
end $$;
-- autor ne može sam otkriti skrivenu recenziju niti je premjestiti
update public.reviews set status = 'skrivena', rating = 5 where author_id = auth.uid() and rating = 4;
do $$ begin
  assert (select r.status from public.reviews r join public.tutors t on t.id = r.tutor_id
           where t.slug like 'marko-juric%') = 'objavljena', 'status recenzije štiti admin';
end $$;
rollback;

-- 5) Poruke vide samo sudionici razgovora
begin;
select set_config('request.jwt.claim.sub', pg_temp.uid('roditelj@petica.test')::text, true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.messages) = 2, 'roditelj vidi samo svoj razgovor (2 poruke)';
  assert (select count(*) from public.my_conversations()) = 1, 'my_conversations';
end $$;
rollback;

begin;
-- tuđi razgovor kao postgres → id; zatim pokušaj kao roditelj
create temp table t_conv as
  select c.id from public.conversations c join auth.users u on u.id = c.student_id where u.email = 'ucenik@petica.test';
grant select on t_conv to authenticated;
select set_config('request.jwt.claim.sub', pg_temp.uid('roditelj@petica.test')::text, true);
set local role authenticated;
do $$ begin
  begin
    insert into public.messages (conversation_id, sender_id, body) values ((select id from t_conv), auth.uid(), 'upad');
    assert false, 'upis u tuđi razgovor je prošao';
  exception when insufficient_privilege then null;
  end;
  perform public.mark_conversation_read((select id from t_conv));
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.messages where conversation_id = (select id from t_conv) and read_at is not null) = 0,
    'tuđi razgovor se ne može označiti pročitanim';
end $$;
rollback;

-- 6) Provjera dobi pri registraciji
begin;
do $$ begin
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'mladi@petica.test',
            jsonb_build_object('role', 'instruktor', 'full_name', 'Mladi', 'birth_date', (current_date - interval '17 years')::date));
    assert false, 'instruktor mlađi od 18 je prošao';
  exception when raise_exception then null;
  end;
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'dijete@petica.test',
            jsonb_build_object('role', 'korisnik', 'full_name', 'Dijete', 'birth_date', (current_date - interval '15 years')::date));
    assert false, 'korisnik mlađi od 16 je prošao';
  exception when raise_exception then null;
  end;
  -- pokušaj registracije kao admin → postaje obični korisnik
  insert into auth.users (id, email, raw_user_meta_data)
  values (gen_random_uuid(), 'lukav@petica.test', '{"role":"admin","full_name":"Lukav","birth_date":"1990-01-01"}');
  assert (select p.role from public.profiles p join auth.users u on u.id = p.id where u.email = 'lukav@petica.test') = 'korisnik',
    'registracija ne smije dati admina';
end $$;
rollback;

-- 7) Admin vidi i uređuje sve
begin;
select set_config('request.jwt.claim.sub', pg_temp.uid('admin@petica.test')::text, true);
set local role authenticated;
update public.tutors set status = 'odobren' where slug like 'filip-saric%';
do $$ begin
  assert (select status from public.tutors where slug like 'filip-saric%') = 'odobren', 'admin odobrava';
  assert (select count(*) from public.profiles) >= 15, 'admin vidi profile';
end $$;
rollback;

-- 8) Pretraga: filteri i redoslijed (istaknuti prvi)
begin;
set local role anon;
do $$ begin
  assert (select bool_or(is_featured) from (select is_featured from public.search_tutors(p_subject => 'matematika') limit 1) x),
    'istaknuti su prvi';
  assert (select count(*) from public.search_tutors(p_subject => 'matematika', p_county => 'Grad Zagreb')) = 1, 'županija';
  assert (select count(*) from public.search_tutors(p_subject => 'programiranje', p_county => 'Grad Zagreb')) = 1, 'programiranje ZG';
  assert (select count(*) from public.search_tutors(p_subject => 'programiranje', p_county => 'Splitsko-dalmatinska županija')) = 0,
    'online instruktor izvan županije bez filtera online';
  assert (select count(*) from public.search_tutors(p_subject => 'programiranje', p_county => 'Splitsko-dalmatinska županija',
                                                    p_modes => array['online'])) = 1, 'online instruktor kad je odabran online';
  assert (select count(*) from public.search_tutors(p_level => 'matura', p_price_max => 15)) >= 1, 'cijena + razina';
  assert (select count(*) from public.search_tutors(p_days => array[7])) = 0, 'nedjeljom nitko ne radi';
  assert (select count(*) from public.search_tutors(p_days => array[6], p_part => 'jutro')) >= 1, 'subota jutro';
end $$;
rollback;


-- 9) Rezervacije prema radnom vremenu
begin;
-- anonimni ne može rezervirati
set local role anon;
do $$ begin
  begin
    perform public.book_lesson((select id from public.tutors where slug like 'ana-horvat%'), now() + interval '2 days', 'online');
    assert false, 'anon rezervacija je prošla';
  exception when insufficient_privilege or raise_exception then null;
  end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', pg_temp.uid('ucenik@petica.test')::text, true);
set local role authenticated;
do $$
declare v_ana uuid := (select id from public.tutors where slug like 'ana-horvat%');
        v_slot timestamptz;
        v_id uuid;
begin
  -- izravan unos u tablicu nije dopušten
  begin
    insert into public.bookings (tutor_id, student_id, starts_at, ends_at, mode)
    values (v_ana, auth.uid(), now() + interval '3 days', now() + interval '3 days 1 hour', 'online');
    assert false, 'izravan unos rezervacije je prošao';
  exception when insufficient_privilege then null;
  end;
  -- termin izvan radnog vremena (nedjelja 3 h ujutro) se odbija
  begin
    perform public.book_lesson(v_ana, date_trunc('week', now()) + interval '13 days 3 hours', 'online');
    assert false, 'termin izvan radnog vremena je prošao';
  exception when raise_exception then null;
  end;
  -- način koji instruktorica ne nudi
  v_slot := (select min(starts_at) from public.free_slots(v_ana, 14));
  assert v_slot >= now() + interval '12 hours', 'poštuje se minimalna najava';
  begin
    perform public.book_lesson(v_ana, v_slot, 'dolazim');
    assert false, 'nepostojeći način je prošao';
  exception when raise_exception then null;
  end;
  v_id := public.book_lesson(v_ana, v_slot, 'online', 'Razlomci');
  assert (select status from public.bookings where id = v_id) = 'potvrden', 'rezervacija je odmah potvrđena';
  assert not exists (select 1 from public.free_slots(v_ana, 14) where starts_at = v_slot), 'termin više nije slobodan';
  assert not exists (select 1 from public.free_slots(v_ana, 14) where starts_at = v_slot + interval '30 min'), 'preklapajući termin nije slobodan';
  assert (select count(*) from public.my_bookings()) = 1, 'my_bookings';
  assert exists (select 1 from public.messages where body like 'Rezervirao/la sam termin%'), 'obavijest u razgovoru';
end $$;
-- drugi korisnik ne može uzeti isti termin, ne vidi tuđu rezervaciju i ne može je otkazati
reset role;
select set_config('request.jwt.claim.sub', pg_temp.uid('roditelj@petica.test')::text, true);
set local role authenticated;
do $$
declare v_ana uuid := (select id from public.tutors where slug like 'ana-horvat%');
        v_b record;
begin
  assert (select count(*) from public.bookings) = 0, 'tuđe rezervacije nisu vidljive';
  reset role;
  select * into v_b from public.bookings limit 1;
  set local role authenticated;
  begin
    perform public.book_lesson(v_ana, v_b.starts_at, 'online');
    assert false, 'dvostruka rezervacija je prošla';
  exception when raise_exception then null;
  end;
  begin
    perform public.cancel_booking(v_b.id, 'hack');
    assert false, 'tuđe otkazivanje je prošlo';
  exception when raise_exception then null;
  end;
end $$;
-- instruktorica otkazuje → termin je ponovno slobodan
reset role;
select set_config('request.jwt.claim.sub', pg_temp.uid('ana@petica.test')::text, true);
set local role authenticated;
do $$
declare v_b record;
begin
  select * into v_b from public.bookings limit 1;
  assert v_b.id is not null, 'instruktorica vidi rezervaciju';
  perform public.cancel_booking(v_b.id, 'Bolesna sam');
  assert (select status from public.bookings where id = v_b.id) = 'otkazan', 'otkazano';
  assert exists (select 1 from public.free_slots(v_b.tutor_id, 14) where starts_at = v_b.starts_at), 'termin opet slobodan';
end $$;
rollback;

-- 10) Hitne instrukcije
begin;
set local role anon;
do $$
declare v_josip uuid := (select id from public.tutors where slug like 'josip-vukovic%');
begin
  assert (select min(starts_at) from public.free_slots(v_josip, 1)) < now() + interval '1 hour', 'hitno: termin unutar sat vremena';
  assert (select bool_or(is_hitno) from public.free_slots(v_josip, 1)), 'hitni termini označeni';
  assert exists (select 1 from public.search_tutors(p_hitno => true) where slug like 'josip-vukovic%' and is_hitno), 'hitno u pretrazi';
  assert not exists (select 1 from public.search_tutors(p_hitno => true) where slug like 'ivan-kovacevic%'), 'Ivan (24 h najave) nije hitan';
end $$;
rollback;

select 'RLS testovi prošli ✓' as rezultat;
