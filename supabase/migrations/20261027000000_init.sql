-- Ruella · schéma initial (lot 0)
-- Modèle de données validé à l'étape 2, règles de sécurité de l'étape 3 :
--   * le catalogue (villes, lieux, contenus, badges) est lisible par tous, modifiable par les éditeurs ;
--   * les données de voyage ne sont lisibles et modifiables que par leur propriétaire (RLS) ;
--   * aucune position GPS n'est stockée : seulement des preuves de visite.

create extension if not exists postgis;

-- ---------------------------------------------------------------- Rôles
create table public.editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.editors enable row level security;
create policy "un éditeur se voit" on public.editors for select using (auth.uid() = user_id);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- Catalogue
create table public.cities (
  id text primary key,                      -- ex. 'prague'
  name text not null,
  country text not null,
  timezone text not null,
  currency text not null,
  transport_rules jsonb not null default '{}', -- prix des tickets, gratuités enfants
  pack_version int not null default 0,
  published boolean not null default false,
  hidden boolean not null default false     -- ville de test (Toulouse)
);

create type public.place_kind as enum ('monument', 'museum', 'gem', 'restaurant', 'viewpoint', 'district', 'park');
create type public.content_status as enum ('draft', 'review', 'published');

create table public.places (
  id uuid primary key default gen_random_uuid(),
  city_id text not null references public.cities (id),
  kind public.place_kind not null,
  location geography(point, 4326) not null,
  validation_radius_m int not null default 80 check (validation_radius_m between 20 and 300),
  min_presence_s int not null default 120,
  indoor boolean not null default false,
  ages text[] not null default '{}',
  tags text[] not null default '{}',        -- envies : histoire, insolite, gourmand…
  opening_hours jsonb not null default '{}',
  prices jsonb not null default '{}',
  ticket_url text,
  must_see boolean not null default false,
  status public.content_status not null default 'draft',
  verified_at date,
  verified_source text,
  updated_at timestamptz not null default now()
);
create index places_city_idx on public.places (city_id);
create index places_location_idx on public.places using gist (location);

create table public.place_contents (
  place_id uuid not null references public.places (id) on delete cascade,
  lang text not null check (lang in ('fr', 'en')),
  name text not null,
  hook text not null check (char_length(hook) <= 120),
  why text,                                 -- « pourquoi c'est canon » (obligatoire pour une pépite)
  tip text,
  story text,
  how_to_find text,
  best_moment text,
  quiz jsonb,
  photo jsonb,                              -- { url, author, license, source }
  primary key (place_id, lang)
);

create table public.badges (
  id text primary key,
  city_id text references public.cities (id), -- null = badge global
  title text not null,
  rule jsonb not null,
  shape text not null default 'round'
);

alter table public.cities enable row level security;
alter table public.places enable row level security;
alter table public.place_contents enable row level security;
alter table public.badges enable row level security;

create policy "catalogue publié lisible" on public.cities for select using (published or public.is_editor());
create policy "lieux publiés lisibles" on public.places for select using (status = 'published' or public.is_editor());
create policy "contenus publiés lisibles" on public.place_contents for select
  using (exists (select 1 from public.places p where p.id = place_id and (p.status = 'published' or public.is_editor())));
create policy "badges lisibles" on public.badges for select using (true);

create policy "éditeurs : villes" on public.cities for all using (public.is_editor()) with check (public.is_editor());
create policy "éditeurs : lieux" on public.places for all using (public.is_editor()) with check (public.is_editor());
create policy "éditeurs : contenus" on public.place_contents for all using (public.is_editor()) with check (public.is_editor());
create policy "éditeurs : badges" on public.badges for all using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------- Données de voyage (propriétaire seulement)
create table public.members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) <= 30), -- prénom ou surnom, jamais de nom complet
  age_band text not null check (age_band in ('under8', '8-12', '13-17', 'adult')),
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  city_id text not null references public.cities (id),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  lodging_label text,
  wishes text[] not null default '{}',
  pace text not null default 'balanced' check (pace in ('calm', 'balanced', 'intense')),
  budget text not null default 'medium' check (budget in ('small', 'medium', 'comfort')),
  updated_at timestamptz not null default now()
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day date not null,
  start_time time,
  rain_plan boolean not null default false,
  stops jsonb not null default '[]',        -- [{ place_id, order, time, status, fixed }]
  updated_at timestamptz not null default now(),
  unique (trip_id, day)
);

-- Preuve de visite : jamais modifiée après coup (ni update ni delete par l'app).
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  place_id uuid not null references public.places (id),
  visited_at timestamptz not null,
  proof text not null check (proof in ('zone', 'auto', 'ticket', 'none')),
  points int not null default 0,
  confirmed boolean not null default false, -- passé à vrai par une fonction serveur (anti-triche)
  unique (member_id, place_id)
);

create table public.earned_badges (
  member_id uuid not null references public.members (id) on delete cascade,
  badge_id text not null references public.badges (id),
  owner_id uuid not null references auth.users (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (member_id, badge_id)
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('free_day', 'city_pass', 'family_annual')),
  city_id text references public.cities (id),
  valid_until timestamptz,
  receipt_verified boolean not null default false
);

alter table public.members enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.visits enable row level security;
alter table public.earned_badges enable row level security;
alter table public.entitlements enable row level security;

create policy "mes membres" on public.members for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "mes séjours" on public.trips for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "mes journées" on public.trip_days for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid()));

-- Visites : l'app peut lire et ajouter, jamais modifier ni supprimer ; la confirmation et les points
-- sont attribués par une fonction serveur (lot 5).
create policy "lire mes visites" on public.visits for select using (auth.uid() = owner_id);
create policy "ajouter une visite" on public.visits for insert
  with check (auth.uid() = owner_id and confirmed = false and points = 0);

create policy "lire mes badges" on public.earned_badges for select using (auth.uid() = owner_id);
create policy "lire mes droits" on public.entitlements for select using (auth.uid() = owner_id);
-- Badges et droits d'accès ne sont écrits que par le serveur (clé de service, jamais dans l'app).
