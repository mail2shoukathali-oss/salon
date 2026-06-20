-- Initial Supabase schema for the salon operations app.
-- Daily closing does not calculate or deduct commission.
-- Commission is calculated only in monthly_payouts at month end.

create extension if not exists pgcrypto;

-- Staff, managers, and owners live in the same profile table.
-- Each profile maps 1:1 to auth.users.id.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  full_name text,
  phone text,
  commission_percentage numeric(5,2) not null default 0 check (commission_percentage between 0 and 100),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Application users with role-based access and commission percentage.';
comment on column public.profiles.commission_percentage is 'Monthly commission percentage used only for monthly payouts.';

-- Catalog of salon services.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  default_price numeric(10,2) not null default 0 check (default_price >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

comment on table public.services is 'Reference list of salon services that can appear in service entries.';

-- Staff enter daily service activity from their phones.
-- Managers review the entries and approve or reject them.
create table if not exists public.service_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,
  service_name text not null,
  service_date date not null default current_date,
  customer_name text,
  customer_phone text,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('cash', 'card', 'online')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.service_entries is 'Daily service entries submitted by staff and reviewed by managers.';
comment on column public.service_entries.payment_method is 'Payment method used for the service entry: cash, card, or online.';
comment on column public.service_entries.status is 'Pending entries await review; approved entries count toward daily sales and monthly payouts.';

-- Manager-entered operating expenses.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  expense_date date not null default current_date,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('cash', 'card', 'online')),
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.expenses is 'Operational expenses recorded by managers.';

-- Daily closing does not calculate or deduct commission.
-- net_balance = total_approved_sales - total_expenses.
-- cash_total, card_total, and online_total reflect approved sales by payment method.
create table if not exists public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null unique,
  manager_id uuid not null references public.profiles (id) on delete restrict,
  total_approved_sales numeric(12,2) not null default 0 check (total_approved_sales >= 0),
  total_expenses numeric(12,2) not null default 0 check (total_expenses >= 0),
  net_balance numeric(12,2) not null default 0,
  cash_total numeric(12,2) not null default 0 check (cash_total >= 0),
  card_total numeric(12,2) not null default 0 check (card_total >= 0),
  online_total numeric(12,2) not null default 0 check (online_total >= 0),
  actual_cash numeric(12,2) not null default 0,
  cash_difference numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.daily_closings is 'Daily operational closeout; commission is not calculated here.';
comment on column public.daily_closings.net_balance is 'Daily sales minus daily expenses.';

-- Commission is calculated only in monthly_payouts at month end.
-- approved monthly staff sales * commission_percentage / 100.
create table if not exists public.monthly_payouts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles (id) on delete restrict,
  month smallint not null check (month between 1 and 12),
  year integer not null check (year between 2000 and 3000),
  total_approved_sales numeric(12,2) not null default 0 check (total_approved_sales >= 0),
  commission_percentage numeric(5,2) not null default 0 check (commission_percentage between 0 and 100),
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  deductions numeric(12,2) not null default 0 check (deductions >= 0),
  advance_deduction numeric(12,2) not null default 0 check (advance_deduction >= 0),
  final_payable numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  calculated_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (staff_id, month, year)
);

comment on table public.monthly_payouts is 'Month-end payout records with commission calculations per staff member.';
comment on column public.monthly_payouts.commission_percentage is 'Staff-specific commission percentage used for the month-end payout.';
comment on column public.monthly_payouts.final_payable is 'Final payout after deductions and advance deductions.';

-- Singleton business settings used by print pages and owner settings UI.
create table if not exists public.business_settings (
  id text primary key default 'main',
  business_name text not null default 'Nawab Salon',
  payout_statement_title text not null default 'Monthly Staff Payout Statement',
  daily_closing_report_title text not null default 'Daily Closing Report',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_settings is 'Singleton salon branding settings for print documents and owner customization.';

insert into public.business_settings (
  id,
  business_name,
  payout_statement_title,
  daily_closing_report_title
) values (
  'main',
  'Nawab Salon',
  'Monthly Staff Payout Statement',
  'Daily Closing Report'
)
on conflict (id) do nothing;

create or replace function public.set_business_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
before update on public.business_settings
for each row
execute function public.set_business_settings_updated_at();

-- Helper functions keep RLS policies readable and consistent.
-- They are defined after the tables so they can safely reference public.profiles.
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = required_role
  );
$$;

create or replace function public.is_owner_or_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('owner', 'manager')
  );
$$;

-- Indexes for common lookups and filters.
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_services_active on public.services (active);
create index if not exists idx_services_status on public.services (status);

create index if not exists idx_service_entries_staff_id on public.service_entries (staff_id);
create index if not exists idx_service_entries_service_date on public.service_entries (service_date);
create index if not exists idx_service_entries_status on public.service_entries (status);
create index if not exists idx_service_entries_staff_date on public.service_entries (staff_id, service_date);

create index if not exists idx_expenses_manager_id on public.expenses (manager_id);
create index if not exists idx_expenses_expense_date on public.expenses (expense_date);

create index if not exists idx_daily_closings_closing_date on public.daily_closings (closing_date);
create index if not exists idx_daily_closings_manager_id on public.daily_closings (manager_id);

create index if not exists idx_monthly_payouts_staff_id on public.monthly_payouts (staff_id);
create index if not exists idx_monthly_payouts_month_year on public.monthly_payouts (year, month);
create index if not exists idx_monthly_payouts_status on public.monthly_payouts (status);

create index if not exists idx_business_settings_updated_at on public.business_settings (updated_at);

-- Enable row level security on every application table.
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.daily_closings enable row level security;
alter table public.monthly_payouts enable row level security;
alter table public.business_settings enable row level security;

-- Remove existing policies first so the file can be re-applied safely.
drop policy if exists profiles_owner_all on public.profiles;
drop policy if exists profiles_manager_select on public.profiles;
drop policy if exists profiles_self_select on public.profiles;

drop policy if exists services_owner_all on public.services;
drop policy if exists services_select on public.services;
drop policy if exists services_insert on public.services;
drop policy if exists services_update on public.services;

drop policy if exists service_entries_owner_all on public.service_entries;
drop policy if exists service_entries_manager_select on public.service_entries;
drop policy if exists service_entries_manager_update on public.service_entries;
drop policy if exists service_entries_staff_insert_own on public.service_entries;
drop policy if exists service_entries_staff_select_own on public.service_entries;
drop policy if exists service_entries_staff_delete_own_pending on public.service_entries;

drop policy if exists expenses_owner_all on public.expenses;
drop policy if exists expenses_manager_all on public.expenses;

drop policy if exists daily_closings_owner_all on public.daily_closings;
drop policy if exists daily_closings_manager_all on public.daily_closings;

drop policy if exists monthly_payouts_owner_all on public.monthly_payouts;
drop policy if exists monthly_payouts_manager_select on public.monthly_payouts;

drop policy if exists business_settings_owner_select on public.business_settings;
drop policy if exists business_settings_manager_select on public.business_settings;
drop policy if exists business_settings_owner_insert on public.business_settings;
drop policy if exists business_settings_owner_update on public.business_settings;

-- profiles: owners can fully manage all profiles, managers can view staff, and users can view their own profile.
create policy profiles_owner_all
on public.profiles
for all
using (public.has_role('owner'))
with check (public.has_role('owner'));

create policy profiles_manager_select
on public.profiles
for select
using (public.is_owner_or_manager());

create policy profiles_self_select
on public.profiles
for select
using (id = auth.uid());

-- services: owner and manager can view, create, and update salon services.
create policy services_select
on public.services
for select
using (public.is_owner_or_manager());

create policy services_insert
on public.services
for insert
with check (public.is_owner_or_manager());

create policy services_update
on public.services
for update
using (public.is_owner_or_manager())
with check (public.is_owner_or_manager());

-- service_entries: staff can create and read their own entries; managers can review them.
create policy service_entries_owner_all
on public.service_entries
for all
using (public.has_role('owner'))
with check (public.has_role('owner'));

create policy service_entries_manager_select
on public.service_entries
for select
using (public.is_owner_or_manager())
;

create policy service_entries_manager_update
on public.service_entries
for update
using (public.is_owner_or_manager())
with check (public.is_owner_or_manager());

create policy service_entries_staff_insert_own
on public.service_entries
for insert
with check (staff_id = auth.uid());

create policy service_entries_staff_select_own
on public.service_entries
for select
using (staff_id = auth.uid());

create policy service_entries_staff_delete_own_pending
on public.service_entries
for delete
using (staff_id = auth.uid() and status = 'pending');

-- expenses: managers manage daily operating expenses; owners can do everything.
create policy expenses_owner_all
on public.expenses
for all
using (public.has_role('owner'))
with check (public.has_role('owner'));

create policy expenses_manager_all
on public.expenses
for all
using (public.has_role('manager'))
with check (public.has_role('manager'));

-- daily_closings: managers create and maintain the closeout records.
create policy daily_closings_owner_all
on public.daily_closings
for all
using (public.has_role('owner'))
with check (public.has_role('owner'));

create policy daily_closings_manager_all
on public.daily_closings
for all
using (public.has_role('manager'))
with check (public.has_role('manager'));

-- monthly_payouts: owners can manage payouts; managers can view operational payout data.
create policy monthly_payouts_owner_all
on public.monthly_payouts
for all
using (public.has_role('owner'))
with check (public.has_role('owner'));

create policy monthly_payouts_manager_select
on public.monthly_payouts
for select
using (public.is_owner_or_manager());

-- business_settings: owner can insert/update and owner/manager can select.
create policy business_settings_owner_select
on public.business_settings
for select
using (public.has_role('owner'));

create policy business_settings_manager_select
on public.business_settings
for select
using (public.is_owner_or_manager());

create policy business_settings_owner_insert
on public.business_settings
for insert
with check (public.has_role('owner'));

create policy business_settings_owner_update
on public.business_settings
for update
using (public.has_role('owner'))
with check (public.has_role('owner'));
