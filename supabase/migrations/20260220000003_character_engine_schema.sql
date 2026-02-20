create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tone text not null check (tone in ('quiet', 'formal', 'witness', 'noir')),
  scope text not null check (scope in ('paris_only', 'global')),
  bio text,
  rules_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.character_fragments (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  lang text not null check (lang in ('fr', 'en')),
  kind text not null check (kind in ('hint', 'witness', 'echo', 'threshold', 'warning')),
  text text not null,
  symbols text[] not null default '{}',
  anchors text[] not null default '{}',
  zones text[] not null default '{}',
  cooldown_minutes int not null default 180,
  weight int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.character_encounters (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  character_id uuid not null references public.characters(id) on delete cascade,
  zone_h3 text not null,
  fragment_id uuid references public.character_fragments(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists character_fragments_character_lang_idx
  on public.character_fragments (character_id, lang);

create index if not exists character_fragments_active_idx
  on public.character_fragments (is_active, lang, kind);

create index if not exists character_fragments_zones_gin_idx
  on public.character_fragments using gin (zones);

create index if not exists character_fragments_anchors_gin_idx
  on public.character_fragments using gin (anchors);

create index if not exists character_fragments_symbols_gin_idx
  on public.character_fragments using gin (symbols);

create index if not exists character_encounters_card_created_idx
  on public.character_encounters (card_id, created_at desc);

create index if not exists character_encounters_character_created_idx
  on public.character_encounters (character_id, created_at desc);

alter table public.characters enable row level security;
alter table public.character_fragments enable row level security;
alter table public.character_encounters enable row level security;

revoke all on public.characters from anon, authenticated;
revoke all on public.character_fragments from anon, authenticated;
revoke all on public.character_encounters from anon, authenticated;
