-- ARCHÉ — Leads table (OPÉRA distribution / partnership tracking)
-- Model: who (name/handle), what (offer/value prop), timeline (phase), potential (scores)

-- Bucket enum for lead categorization
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_bucket') then
    create type lead_bucket as enum (
      'hotels_concierge',
      'guides',
      'creators',
      'experience_studios',
      'fundraising',
      'other'
    );
  end if;
end $$;

-- Contact status enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_contact_status') then
    create type lead_contact_status as enum (
      'identified',
      'researching',
      'contacted',
      'in_conversation',
      'negotiating',
      'converted',
      'declined',
      'dormant'
    );
  end if;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),

  -- Core identity
  name text not null,
  normalized_name text not null,
  handle text,
  domain text,
  email text,

  -- Categorization
  bucket lead_bucket not null default 'other',
  section text, -- Original section from source doc (e.g., "DÉCLENCHEURS", "NARRATEURS CULTURELS")

  -- Value proposition / offer
  value_prop text,
  offer text,

  -- Pipeline
  contact_status lead_contact_status not null default 'identified',
  next_action text,
  due_date date,

  -- Activation timeline (from constellation phases)
  activation_phase int check (activation_phase is null or activation_phase between 1 and 4),

  -- Scores (0-100)
  distribution_power int check (distribution_power is null or distribution_power between 0 and 100),
  fit_score int check (fit_score is null or fit_score between 0 and 100),

  -- Link to intention/mission
  intention_id uuid references public.intentions(id) on delete set null,

  -- Notes and metadata
  notes text,
  metadata jsonb not null default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists leads_normalized_name_idx on public.leads(normalized_name);
create index if not exists leads_handle_idx on public.leads(handle);
create index if not exists leads_bucket_idx on public.leads(bucket);
create index if not exists leads_contact_status_idx on public.leads(contact_status);
create index if not exists leads_intention_id_idx on public.leads(intention_id);
create index if not exists leads_activation_phase_idx on public.leads(activation_phase);

-- Trigger for updated_at
drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- Unique constraint on handle per intention (avoid duplicate leads in same campaign)
create unique index if not exists leads_handle_intention_unique
on public.leads(handle, intention_id)
where handle is not null and intention_id is not null;

comment on table public.leads is 'OPÉRA lead tracking: who, what (offer), timeline (phase), potential (scores). FK to intentions for mission grouping.';
