-- Manual Supabase SQL for the activity log MVP.
-- Apply this in the Supabase SQL editor.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null references auth.users(id) on delete set null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('owner', 'manager', 'staff')),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  entity_label text null,
  business_date date null,
  period_year int null,
  period_month int null,
  before_data jsonb null,
  after_data jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_created_at
  on public.activity_logs (created_at desc);

create index if not exists idx_activity_logs_actor_id_created_at
  on public.activity_logs (actor_id, created_at desc);

create index if not exists idx_activity_logs_entity_type_entity_id
  on public.activity_logs (entity_type, entity_id);

create index if not exists idx_activity_logs_business_date
  on public.activity_logs (business_date);

create index if not exists idx_activity_logs_period_year_month
  on public.activity_logs (period_year, period_month);

alter table public.activity_logs enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'Owner and manager can view activity logs'
  ) then
    drop policy "Owner and manager can view activity logs" on public.activity_logs;
  end if;
end $$;

create policy "Owner and manager can view activity logs"
on public.activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('owner', 'manager')
  )
);

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'Authenticated users can insert activity logs'
  ) then
    drop policy "Authenticated users can insert activity logs" on public.activity_logs;
  end if;
end $$;

create policy "Authenticated users can insert activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
);

