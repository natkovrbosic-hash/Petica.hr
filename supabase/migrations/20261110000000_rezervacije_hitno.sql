-- Rezervacije termina prema radnom vremenu instruktora + hitne instrukcije („Slobodan sam sada”)
-- Sva vremena dostupnosti su lokalna (Europe/Zagreb); rezervacije se spremaju kao timestamptz.

create extension if not exists btree_gist with schema extensions;

alter table public.tutors
  add column bookings_enabled boolean not null default true,
  add column lesson_minutes int not null default 60 check (lesson_minutes in (45, 60, 90, 120)),
  add column booking_notice_hours int not null default 12 check (booking_notice_hours between 0 and 72),
  add column hitno_until timestamptz;

create type public.booking_status as enum ('potvrden', 'otkazan');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null check (mode in ('kod_mene', 'dolazim', 'online')),
  note text check (char_length(note) <= 500),
  is_hitno boolean not null default false,
  status public.booking_status not null default 'potvrden',
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancel_reason text check (char_length(cancel_reason) <= 300),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (student_id <> tutor_id),
  -- isti instruktor ne može imati dva potvrđena termina koji se preklapaju (štiti i od istovremenih rezervacija)
  constraint bookings_no_overlap exclude using gist (
    tutor_id with =, tstzrange(starts_at, ends_at) with &&
  ) where (status = 'potvrden')
);
create index bookings_student_idx on public.bookings (student_id, starts_at);
create index bookings_tutor_idx on public.bookings (tutor_id, starts_at);

alter table public.bookings enable row level security;
create policy "bookings: sudionici i admin" on public.bookings
  for select using (auth.uid() in (student_id, tutor_id) or public.is_admin());
-- unos i otkazivanje samo preko funkcija book_lesson / cancel_booking (provjere termina)

-- Instruktor smije sam mijenjati postavke rezervacija i hitnosti (tutors_protect ih ne dira).

-- ---------------------------------------------------------------------------
-- Slobodni termini: tjedna dostupnost (+ prozor „Slobodan sam sada”) − potvrđene rezervacije.
-- Početak svakih 30 min od početka prozora, trajanje = lesson_minutes. Najava se ne traži dok je instruktor „hitno” slobodan.
-- ---------------------------------------------------------------------------
create or replace function public.free_slots(p_tutor uuid, p_days int default 14)
returns table (starts_at timestamptz, ends_at timestamptz, is_hitno boolean)
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select id, lesson_minutes, booking_notice_hours, hitno_until,
           make_interval(mins => lesson_minutes) as len
      from public.tutors
     where id = p_tutor and status = 'odobren' and bookings_enabled
  ),
  local_now as (select (now() at time zone 'Europe/Zagreb') as ts),
  days as (
    select ((select ts from local_now)::date + i) as d
      from generate_series(0, least(greatest(coalesce(p_days, 14), 1), 28) - 1) i
  ),
  windows as (
    -- tjedni raspored (lokalno vrijeme)
    select (dd.d + a.start_time) as w_start, (dd.d + a.end_time) as w_end
      from days dd
      join public.availability a on a.tutor_id = p_tutor and a.weekday = extract(isodow from dd.d)
    union all
    -- hitni prozor: od sljedećih punih 15 min do hitno_until
    select date_trunc('hour', ln.ts) + make_interval(mins => (ceil(extract(minute from ln.ts) / 15) * 15)::int),
           (t.hitno_until at time zone 'Europe/Zagreb')
      from t, local_now ln
     where t.hitno_until > now()
  ),
  cand as (
    select distinct (gs at time zone 'Europe/Zagreb') as s
      from windows w, t,
           generate_series(w.w_start, w.w_end - t.len, interval '30 min') gs
     where w.w_end - w.w_start >= t.len
  )
  select c.s, c.s + t.len, (t.hitno_until is not null and c.s < t.hitno_until)
    from cand c, t
   where c.s >= now() + case when t.hitno_until > c.s then interval '0' else make_interval(hours => t.booking_notice_hours) end
     and c.s < now() + make_interval(days => least(greatest(coalesce(p_days, 14), 1), 28))
     and not exists (
       select 1 from public.bookings b
        where b.tutor_id = p_tutor and b.status = 'potvrden'
          and tstzrange(b.starts_at, b.ends_at) && tstzrange(c.s, c.s + t.len))
   order by c.s;
$$;

create or replace function public.next_free_slot(p_tutor uuid, p_days int default 7)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select min(starts_at) from public.free_slots(p_tutor, p_days);
$$;

-- Rezervacija termina: odmah potvrđena ako je termin slobodan prema radnom vremenu instruktora.
create or replace function public.book_lesson(p_tutor uuid, p_starts_at timestamptz, p_mode text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_slot record;
  v_modes text[];
  v_id uuid;
  v_conv uuid;
begin
  if v_me is null then raise exception 'Prijavite se za rezervaciju.'; end if;
  if v_me = p_tutor then raise exception 'Ne možete rezervirati termin kod sebe.'; end if;
  select modes into v_modes from public.tutors where id = p_tutor;
  if p_mode is null or not (p_mode = any (coalesce(v_modes, '{}'))) then
    raise exception 'Odaberite način održavanja koji instruktor nudi.';
  end if;
  select * into v_slot from public.free_slots(p_tutor, 28) s where s.starts_at = p_starts_at;
  if not found then raise exception 'Termin više nije slobodan. Odaberite drugi.'; end if;
  if (select count(*) from public.bookings
       where student_id = v_me and status = 'potvrden' and starts_at > now()) >= 10 then
    raise exception 'Imate previše nadolazećih termina (najviše 10).';
  end if;

  begin
    insert into public.bookings (tutor_id, student_id, starts_at, ends_at, mode, note, is_hitno)
    values (p_tutor, v_me, v_slot.starts_at, v_slot.ends_at, p_mode, nullif(btrim(p_note), ''), v_slot.is_hitno)
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Termin je upravo zauzet. Odaberite drugi.';
  end;

  -- obavijest u razgovoru (otvara razgovor ako ga još nema)
  insert into public.conversations (student_id, tutor_id) values (v_me, p_tutor)
  on conflict (student_id, tutor_id) do update set last_message_at = now()
  returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, v_me,
          'Rezervirao/la sam termin: ' ||
          to_char(v_slot.starts_at at time zone 'Europe/Zagreb', 'DD.MM.YYYY. "u" HH24:MI') ||
          case p_mode when 'online' then ' (online)' when 'dolazim' then ' (dolazak kući)' else ' (kod instruktora)' end ||
          coalesce(E'\n' || nullif(btrim(p_note), ''), ''));
  return v_id;
end;
$$;

create or replace function public.cancel_booking(p_booking uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking;
  if not found or auth.uid() is null or auth.uid() not in (v_b.student_id, v_b.tutor_id) then
    raise exception 'Termin nije pronađen.';
  end if;
  if v_b.status <> 'potvrden' then raise exception 'Termin je već otkazan.'; end if;
  if v_b.starts_at < now() then raise exception 'Prošli termin se ne može otkazati.'; end if;
  update public.bookings
     set status = 'otkazan', cancelled_by = auth.uid(), cancel_reason = nullif(btrim(p_reason), '')
   where id = p_booking;
end;
$$;

-- Moji termini (kao učenik ili instruktor) s imenom druge strane
create or replace function public.my_bookings()
returns table (
  id uuid, tutor_id uuid, student_id uuid, starts_at timestamptz, ends_at timestamptz, mode text, note text,
  is_hitno boolean, status public.booking_status, cancel_reason text, cancelled_by uuid,
  other_name text, tutor_slug text, i_am_tutor boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.tutor_id, b.student_id, b.starts_at, b.ends_at, b.mode, b.note, b.is_hitno, b.status,
         b.cancel_reason, b.cancelled_by,
         case when b.tutor_id = auth.uid() then p.full_name else t.display_name end,
         t.slug, b.tutor_id = auth.uid()
    from public.bookings b
    join public.tutors t on t.id = b.tutor_id
    join public.profiles p on p.id = b.student_id
   where auth.uid() in (b.student_id, b.tutor_id)
   order by b.starts_at;
$$;

revoke execute on function public.book_lesson(uuid, timestamptz, text, text) from anon;
revoke execute on function public.cancel_booking(uuid, text) from anon;

-- ---------------------------------------------------------------------------
-- Pretraga: + hitno (slobodan sada ili prvi termin unutar 24 h), + prvi slobodni termin
-- ---------------------------------------------------------------------------
drop function public.search_tutors(text, text, text, double precision, double precision, int, text[], numeric, numeric, int[], text, text, int, int);

create or replace function public.search_tutors(
  p_subject text default null,
  p_level text default null,
  p_county text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km int default null,
  p_modes text[] default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_days int[] default null,
  p_part text default null,
  p_sort text default 'preporuceno',
  p_limit int default 20,
  p_offset int default 0,
  p_hitno boolean default false
)
returns table (
  id uuid, slug text, display_name text, headline text, photo_url text, subjects text[], levels text[],
  modes text[], price_eur numeric, city text, county text, experience_years int, rating_avg numeric,
  rating_count int, is_featured boolean, is_test boolean, distance_km double precision,
  is_hitno boolean, next_slot timestamptz, total_count bigint
)
language sql
stable
set search_path = public
as $$
  with params as (
    select case p_part when 'jutro' then time '08:00' when 'popodne' then time '12:00'
                       when 'vecer' then time '17:00' end as part_start,
           case p_part when 'jutro' then time '12:00' when 'popodne' then time '17:00'
                       when 'vecer' then time '21:00' end as part_end
  ),
  base as (
    select t.*,
           (t.featured_until is not null and t.featured_until > now()) as featured,
           (t.hitno_until is not null and t.hitno_until > now()) as hitno_now,
           case when p_lat is not null and p_lng is not null and t.lat is not null and t.lng is not null then
             2 * 6371 * asin(sqrt(
               power(sin(radians(t.lat - p_lat) / 2), 2) +
               cos(radians(p_lat)) * cos(radians(t.lat)) * power(sin(radians(t.lng - p_lng) / 2), 2)))
           end as dist
      from public.tutors t
     where t.status = 'odobren'
       and (p_subject is null or p_subject = any (t.subjects))
       and (p_level is null or p_level = any (t.levels))
       and (p_modes is null or cardinality(p_modes) = 0 or t.modes && p_modes)
       and (p_price_min is null or t.price_eur >= p_price_min)
       and (p_price_max is null or t.price_eur <= p_price_max)
  ),
  filtered as (
    select b.*, public.next_free_slot(b.id, 7) as nslot
      from base b, params pr
     where (p_county is null or b.county = p_county
            or ('online' = any (b.modes) and p_modes is not null and 'online' = any (p_modes)))
       and (p_lat is null or p_lng is null
            or b.dist <= greatest(coalesce(p_radius_km, 10), case when 'dolazim' = any (b.modes) then b.travel_radius_km else 0 end)
            or ('online' = any (b.modes) and p_modes is not null and 'online' = any (p_modes)))
       and ((p_days is null or cardinality(p_days) = 0) and p_part is null
            or exists (select 1 from public.availability a
                        where a.tutor_id = b.id
                          and (p_days is null or cardinality(p_days) = 0 or a.weekday = any (p_days))
                          and (pr.part_start is null or (a.start_time < pr.part_end and a.end_time > pr.part_start))))
  )
  select f.id, f.slug, f.display_name, f.headline, f.photo_url, f.subjects, f.levels, f.modes, f.price_eur,
         f.city, f.county, f.experience_years, f.rating_avg, f.rating_count, f.featured, f.is_test,
         round(f.dist::numeric, 1)::double precision, f.hitno_now, f.nslot,
         count(*) over ()
    from filtered f
   where not coalesce(p_hitno, false) or f.hitno_now or f.nslot < now() + interval '24 hours'
   order by f.featured desc,
            case when coalesce(p_hitno, false) then f.nslot end asc nulls last,
            case when p_sort = 'cijena_asc' then f.price_eur end asc nulls last,
            case when p_sort = 'cijena_desc' then f.price_eur end desc nulls last,
            case when p_sort = 'udaljenost' then f.dist end asc nulls last,
            case when p_sort = 'ocjena' then f.rating_avg end desc,
            case when p_sort = 'termin' then f.nslot end asc nulls last,
            (f.rating_avg * f.rating_count + 4.0 * 3) / (f.rating_count + 3) desc,
            f.approved_at desc nulls last
   limit least(coalesce(p_limit, 20), 50) offset greatest(coalesce(p_offset, 0), 0);
$$;
