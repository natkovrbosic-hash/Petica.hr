-- Instrukcije24.hr — početna shema
-- Sve tablice imaju RLS. Pisanje osjetljivih stupaca (uloga, status odobrenja, istaknutost, ocjene)
-- dopušteno je samo adminu ili servisnom ključu (webhook, server akcije) — vidi triggere *_protect.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipovi
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('korisnik', 'instruktor', 'admin');
create type public.tutor_status as enum ('na_cekanju', 'odobren', 'odbijen');
create type public.review_status as enum ('objavljena', 'skrivena');
create type public.report_status as enum ('otvorena', 'rijesena', 'odbacena');

-- ---------------------------------------------------------------------------
-- Profili
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'korisnik',
  full_name text not null check (char_length(full_name) between 2 and 80),
  birth_date date not null,
  email_notifications boolean not null default true,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Instruktori
-- ---------------------------------------------------------------------------
create table public.tutors (
  id uuid primary key references public.profiles (id) on delete cascade,
  slug text not null unique,
  display_name text not null check (char_length(display_name) between 2 and 80),
  status public.tutor_status not null default 'na_cekanju',
  rejection_reason text,
  headline text check (char_length(headline) <= 120),
  bio text check (char_length(bio) <= 3000),
  photo_url text,
  subjects text[] not null default '{}',
  levels text[] not null default '{}',
  modes text[] not null default '{}' check (modes <@ array['kod_mene', 'dolazim', 'online']),
  price_eur numeric(6, 2) check (price_eur between 1 and 500),
  city text,
  county text,
  lat double precision,
  lng double precision,
  travel_radius_km int not null default 10 check (travel_radius_km between 0 and 100),
  experience_years int check (experience_years between 0 and 60),
  experience text check (char_length(experience) <= 2000),
  featured_until timestamptz,
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  is_test boolean not null default false,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tutors_status_idx on public.tutors (status);
create index tutors_subjects_idx on public.tutors using gin (subjects);
create index tutors_levels_idx on public.tutors using gin (levels);
create index tutors_city_idx on public.tutors (city);
create index tutors_county_idx on public.tutors (county);

create table public.availability (
  id bigint generated always as identity primary key,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- 1 = ponedjeljak
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index availability_tutor_idx on public.availability (tutor_id);

-- ---------------------------------------------------------------------------
-- Poruke
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (student_id, tutor_id),
  check (student_id <> tutor_id)
);
create index conversations_tutor_idx on public.conversations (tutor_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Recenzije, favoriti, prijave
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  status public.review_status not null default 'objavljena',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tutor_id, author_id)
);
create index reviews_tutor_idx on public.reviews (tutor_id);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tutor_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('recenzija', 'profil', 'poruka')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status public.report_status not null default 'otvorena',
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Pretplate (Istaknuti profil) — piše ih samo Stripe webhook servisnim ključem
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  tutor_id uuid primary key references public.tutors (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  source text not null default 'stripe' check (source in ('stripe', 'promo', 'test')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pomoćne funkcije i triggeri
-- ---------------------------------------------------------------------------
create or replace function public.slugify(txt text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(txt, '')), 'čćšžđáàäéèëíìïóòöúùü', 'ccszdaaaeeeiiiooouuu'),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- Novi korisnik iz Supabase Auth → profil (+ instruktor). Provjera dobi: instruktor 18+, korisnik 16+.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_name text := nullif(btrim(meta ->> 'full_name'), '');
  v_birth date;
  v_age int;
begin
  v_role := case when meta ->> 'role' = 'instruktor' then 'instruktor' else 'korisnik' end;
  begin
    v_birth := (meta ->> 'birth_date')::date;
  exception when others then
    v_birth := null;
  end;
  if v_birth is null then
    raise exception 'Datum rođenja je obavezan.';
  end if;
  v_age := extract(year from age(current_date, v_birth));
  if v_role = 'instruktor' and v_age < 18 then
    raise exception 'Instruktor mora imati najmanje 18 godina.';
  end if;
  if v_role = 'korisnik' and v_age < 16 then
    raise exception 'Za korištenje platforme potrebno je imati najmanje 16 godina (mlađima račun otvara roditelj).';
  end if;
  if v_name is null then
    v_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, role, full_name, birth_date)
  values (new.id, v_role, left(v_name, 80), v_birth);

  if v_role = 'instruktor' then
    insert into public.tutors (id, slug, display_name)
    values (new.id, public.slugify(v_name) || '-' || left(replace(new.id::text, '-', ''), 6), left(v_name, 80));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Obični korisnik ne smije sam sebi promijeniti ulogu ili oznaku testnog računa
create or replace function public.profiles_protect()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' and not public.is_admin() then
    new.role := old.role;
    new.is_test := old.is_test;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.profiles_protect();

-- Instruktor uređuje svoj profil, ali ne status odobrenja, istaknutost, ocjene ni slug
create or replace function public.tutors_protect()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if current_user = 'authenticated' and not public.is_admin() then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.featured_until := old.featured_until;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.is_test := old.is_test;
    new.approved_at := old.approved_at;
    new.slug := old.slug;
    new.created_at := old.created_at;
    -- odbijeni profil nakon izmjene ponovno ide na pregled
    if old.status = 'odbijen' and new.submitted_at is distinct from old.submitted_at then
      new.status := 'na_cekanju';
      new.rejection_reason := null;
    end if;
  end if;
  return new;
end;
$$;
create trigger tutors_protect before update on public.tutors
  for each row execute function public.tutors_protect();

create or replace function public.messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.messages_after_insert();

create or replace function public.refresh_tutor_rating(p_tutor uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tutors t
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews
                                 where tutor_id = p_tutor and status = 'objavljena'), 0),
         rating_count = (select count(*) from public.reviews where tutor_id = p_tutor and status = 'objavljena')
   where t.id = p_tutor;
$$;

create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_tutor_rating(coalesce(new.tutor_id, old.tutor_id));
  return null;
end;
$$;
create trigger reviews_after_change after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

create or replace function public.reviews_protect()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if current_user = 'authenticated' and not public.is_admin() then
    new.status := old.status;
    new.tutor_id := old.tutor_id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger reviews_protect before update on public.reviews
  for each row execute function public.reviews_protect();

-- Recenziju smije ostaviti samo korisnik koji je s instruktorom razmijenio poruke
-- (u razgovoru postoji barem jedna poruka korisnika i barem jedna poruka instruktora).
create or replace function public.can_review(p_tutor uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
     where c.tutor_id = p_tutor
       and c.student_id = auth.uid()
       and exists (select 1 from public.messages m where m.conversation_id = c.id and m.sender_id = c.student_id)
       and exists (select 1 from public.messages m where m.conversation_id = c.id and m.sender_id = c.tutor_id)
  );
$$;

create or replace function public.is_conversation_member(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.conversations
                  where id = p_conversation and auth.uid() in (student_id, tutor_id));
$$;

-- Popis razgovora prijavljenog korisnika s imenom druge strane i brojem nepročitanih poruka
create or replace function public.my_conversations()
returns table (
  id uuid,
  student_id uuid,
  tutor_id uuid,
  other_name text,
  other_photo text,
  tutor_slug text,
  last_message text,
  last_message_at timestamptz,
  unread bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.student_id, c.tutor_id,
         case when c.student_id = auth.uid() then t.display_name else p.full_name end,
         case when c.student_id = auth.uid() then t.photo_url else null end,
         t.slug,
         (select m.body from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
         c.last_message_at,
         (select count(*) from public.messages m
           where m.conversation_id = c.id and m.sender_id <> auth.uid() and m.read_at is null)
    from public.conversations c
    join public.tutors t on t.id = c.tutor_id
    join public.profiles p on p.id = c.student_id
   where auth.uid() in (c.student_id, c.tutor_id)
   order by c.last_message_at desc;
$$;

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages set read_at = now()
   where conversation_id = p_conversation
     and sender_id <> auth.uid()
     and read_at is null
     and public.is_conversation_member(p_conversation);
$$;

-- Javni prikaz autora recenzija: samo ime i početno slovo prezimena („Luka U.”)
create or replace function public.review_author_names(p_tutor uuid)
returns table (author_id uuid, short_name text)
language sql
stable
security definer
set search_path = public
as $$
  select r.author_id,
         split_part(btrim(regexp_replace(p.full_name, '\(TEST\)', '')), ' ', 1)
           || coalesce(' ' || nullif(left(split_part(btrim(regexp_replace(p.full_name, '\(TEST\)', '')), ' ', 2), 1), '') || '.', '')
    from public.reviews r
    join public.profiles p on p.id = r.author_id
   where r.tutor_id = p_tutor and r.status = 'objavljena';
$$;

-- ---------------------------------------------------------------------------
-- Pretraga
-- ---------------------------------------------------------------------------
-- p_part: 'jutro' (08–12), 'popodne' (12–17), 'vecer' (17–21)
-- Lokacija: ako su zadani p_lat/p_lng, prikazuju se instruktori unutar p_radius_km; instruktori koji rade
-- online prikazuju se i izvan radijusa ako je korisnik u filteru odabrao „online”.
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
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  display_name text,
  headline text,
  photo_url text,
  subjects text[],
  levels text[],
  modes text[],
  price_eur numeric,
  city text,
  county text,
  experience_years int,
  rating_avg numeric,
  rating_count int,
  is_featured boolean,
  is_test boolean,
  distance_km double precision,
  total_count bigint
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
  )
  select b.id, b.slug, b.display_name, b.headline, b.photo_url, b.subjects, b.levels, b.modes, b.price_eur,
         b.city, b.county, b.experience_years, b.rating_avg, b.rating_count, b.featured, b.is_test,
         round(b.dist::numeric, 1)::double precision,
         count(*) over ()
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
   order by b.featured desc,
            case when p_sort = 'cijena_asc' then b.price_eur end asc nulls last,
            case when p_sort = 'cijena_desc' then b.price_eur end desc nulls last,
            case when p_sort = 'udaljenost' then b.dist end asc nulls last,
            case when p_sort = 'ocjena' then b.rating_avg end desc,
            -- „Preporučeno”: Bayesov prosjek (nove profile ne kažnjava ni ne precjenjuje)
            (b.rating_avg * b.rating_count + 4.0 * 3) / (b.rating_count + 3) desc,
            b.approved_at desc nulls last
   limit least(coalesce(p_limit, 20), 50) offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Broj odobrenih instruktora po (predmet, grad) — za SEO stranice i sitemap
create or replace function public.tutor_counts_by_subject_city()
returns table (subject text, city text, n bigint)
language sql
stable
set search_path = public
as $$
  select s, t.city, count(*)
    from public.tutors t, unnest(t.subjects) s
   where t.status = 'odobren' and t.city is not null
   group by s, t.city;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tutors enable row level security;
alter table public.availability enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: datum rođenja nije javan; javno ime instruktora je u tutors.display_name
create policy "profiles: vlastiti ili admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: uređivanje vlastitog" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "tutors: odobreni javno, vlastiti, admin" on public.tutors
  for select using (status = 'odobren' or id = auth.uid() or public.is_admin());
create policy "tutors: uređivanje vlastitog" on public.tutors
  for update using (id = auth.uid() or public.is_admin());

create policy "availability: javno za vidljive profile" on public.availability
  for select using (exists (select 1 from public.tutors t where t.id = tutor_id
                             and (t.status = 'odobren' or t.id = auth.uid() or public.is_admin())));
create policy "availability: vlastita (unos)" on public.availability
  for insert with check (tutor_id = auth.uid());
create policy "availability: vlastita (izmjena)" on public.availability
  for update using (tutor_id = auth.uid());
create policy "availability: vlastita (brisanje)" on public.availability
  for delete using (tutor_id = auth.uid());

create policy "conversations: sudionici" on public.conversations
  for select using (auth.uid() in (student_id, tutor_id) or public.is_admin());
create policy "conversations: korisnik otvara razgovor" on public.conversations
  for insert with check (
    student_id = auth.uid()
    and exists (select 1 from public.tutors t where t.id = tutor_id and t.status = 'odobren'));

create policy "messages: sudionici čitaju" on public.messages
  for select using (public.is_conversation_member(conversation_id) or public.is_admin());
create policy "messages: sudionici pišu" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy "reviews: objavljene javno" on public.reviews
  for select using (status = 'objavljena' or author_id = auth.uid() or public.is_admin());
create policy "reviews: samo nakon razmjene poruka" on public.reviews
  for insert with check (author_id = auth.uid() and public.can_review(tutor_id));
create policy "reviews: autor uređuje" on public.reviews
  for update using (author_id = auth.uid() or public.is_admin());
create policy "reviews: autor ili admin briše" on public.reviews
  for delete using (author_id = auth.uid() or public.is_admin());

create policy "favorites: vlastiti" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reports: unos" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "reports: vlastite ili admin" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
create policy "reports: admin rješava" on public.reports
  for update using (public.is_admin());

create policy "subscriptions: vlastita ili admin" on public.subscriptions
  for select using (tutor_id = auth.uid() or public.is_admin());

-- interne funkcije ne trebaju biti dostupne preko API-ja
revoke execute on function public.refresh_tutor_rating(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (poruke) i Storage (slike profila)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: javno čitanje" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: upload u vlastitu mapu" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: izmjena vlastitih" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: brisanje vlastitih" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
