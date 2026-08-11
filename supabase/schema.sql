-- ============================================================
-- SISTEM INVENTORY & PEMINJAMAN BARANG
-- Supabase / PostgreSQL schema
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ---------- REFERENCE TABLES ----------

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- ---------- PROFILES ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text unique,
  username text unique,
  name text not null,
  email text,
  department_id uuid references public.departments(id),
  role text not null default 'mechanic' check (role in ('admin','mechanic','supervisor')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ITEMS ----------

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  name text not null,
  category_id uuid references public.categories(id),
  brand text,
  model text,
  serial_number text,
  unit text default 'pcs',
  quantity numeric not null default 1 check (quantity >= 0),
  location_id uuid references public.locations(id),
  condition text not null default 'GOOD' check (condition in ('GOOD','LIGHT_DAMAGE','HEAVY_DAMAGE','MAINTENANCE','LOST')),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','BORROWED','MAINTENANCE','DAMAGED','LOST','INACTIVE')),
  photo_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_status_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

-- ---------- TRANSACTIONS ----------

create table if not exists public.borrowings (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  borrower_id uuid not null references public.profiles(id),
  purpose text,
  location_of_use text,
  borrow_date timestamptz not null default now(),
  expected_return_date timestamptz,
  status text not null default 'BORROWED' check (status in ('PENDING','APPROVED','BORROWED','PARTIALLY_RETURNED','RETURNED','OVERDUE','CANCELLED')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.borrowing_items (
  id uuid primary key default gen_random_uuid(),
  borrowing_id uuid not null references public.borrowings(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity numeric not null check (quantity > 0),
  returned_quantity numeric not null default 0 check (returned_quantity >= 0),
  status text not null default 'OUTSTANDING' check (status in ('OUTSTANDING','PARTIAL','RETURNED')),
  created_at timestamptz not null default now()
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  borrowing_id uuid not null references public.borrowings(id),
  returned_by uuid not null references public.profiles(id),
  return_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  borrowing_item_id uuid not null references public.borrowing_items(id),
  item_id uuid not null references public.items(id),
  quantity numeric not null check (quantity > 0),
  condition text not null default 'GOOD' check (condition in ('GOOD','LIGHT_DAMAGE','HEAVY_DAMAGE','MAINTENANCE')),
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- MAINTENANCE ----------

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  maintenance_number text unique,
  item_id uuid not null references public.items(id),
  start_date timestamptz not null default now(),
  problem text,
  description text,
  technician text,
  cost numeric,
  expected_finish timestamptz,
  actual_finish timestamptz,
  status text not null default 'ONGOING' check (status in ('ONGOING','COMPLETED','CANCELLED')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- STOCK OPNAME ----------

create table if not exists public.stock_opnames (
  id uuid primary key default gen_random_uuid(),
  opname_number text not null unique,
  checked_by uuid not null references public.profiles(id),
  checked_at timestamptz not null default now(),
  status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS','COMPLETED')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_opname_items (
  id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references public.stock_opnames(id) on delete cascade,
  item_id uuid not null references public.items(id),
  system_quantity numeric not null,
  physical_quantity numeric not null,
  difference numeric not null,
  condition text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- NOTIFICATIONS ----------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info','success','warning','danger')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- AUDIT LOG ----------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  user_name text,
  action text not null,
  module text not null,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ---------- NUMBER SEQUENCES ----------

create table if not exists public.number_sequences (
  key text primary key,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Generate sequential transaction number, e.g. BRW-20260811-0001
create or replace function public.generate_transaction_number(prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  today text := to_char(now(), 'YYYYMMDD');
  key text := prefix || '-' || today;
  seq bigint;
  result text;
begin
  insert into public.number_sequences (key, last_value)
  values (key, 1)
  on conflict (key)
  do update set last_value = public.number_sequences.last_value + 1,
                updated_at = now()
  returning last_value into seq;

  result := prefix || '-' || today || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- ---------- HELPERS ----------

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(current_role() = 'admin', false);
$$;

create or replace function public.is_supervisor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(current_role() in ('admin','supervisor'), false);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.items
for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.borrowings
for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.maintenance
for each row execute function public.set_updated_at();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'mechanic')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- INDEXES ----------

create index if not exists idx_items_code on public.items (item_code);
create index if not exists idx_items_status on public.items (status);
create index if not exists idx_items_category on public.items (category_id);
create index if not exists idx_items_location on public.items (location_id);
create index if not exists idx_borrowings_borrower on public.borrowings (borrower_id);
create index if not exists idx_borrowings_status on public.borrowings (status);
create index if not exists idx_borrowing_items_item on public.borrowing_items (item_id);
create index if not exists idx_return_items_item on public.return_items (item_id);
create index if not exists idx_history_item on public.item_status_history (item_id);
create index if not exists idx_audit_created on public.audit_logs (created_at desc);
create index if not exists idx_notifications_user on public.notifications (user_id);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.roles enable row level security;
alter table public.departments enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_status_history enable row level security;
alter table public.borrowings enable row level security;
alter table public.borrowing_items enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.maintenance enable row level security;
alter table public.stock_opnames enable row level security;
alter table public.stock_opname_items enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_sequences enable row level security;

-- Reads: any authenticated user
drop policy if exists "read roles" on public.roles;
create policy "read roles" on public.roles for select to authenticated using (true);

drop policy if exists "read departments" on public.departments;
create policy "read departments" on public.departments for select to authenticated using (true);

drop policy if exists "read categories" on public.categories;
create policy "read categories" on public.categories for select to authenticated using (true);

drop policy if exists "read locations" on public.locations;
create policy "read locations" on public.locations for select to authenticated using (true);

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "read items" on public.items;
create policy "read items" on public.items for select to authenticated using (true);

drop policy if exists "read item_status_history" on public.item_status_history;
create policy "read item_status_history" on public.item_status_history for select to authenticated using (true);

drop policy if exists "read borrowings" on public.borrowings;
create policy "read borrowings" on public.borrowings for select to authenticated using (true);

drop policy if exists "read borrowing_items" on public.borrowing_items;
create policy "read borrowing_items" on public.borrowing_items for select to authenticated using (true);

drop policy if exists "read returns" on public.returns;
create policy "read returns" on public.returns for select to authenticated using (true);

drop policy if exists "read return_items" on public.return_items;
create policy "read return_items" on public.return_items for select to authenticated using (true);

drop policy if exists "read maintenance" on public.maintenance;
create policy "read maintenance" on public.maintenance for select to authenticated using (true);

drop policy if exists "read stock_opnames" on public.stock_opnames;
create policy "read stock_opnames" on public.stock_opnames for select to authenticated using (true);

drop policy if exists "read stock_opname_items" on public.stock_opname_items;
create policy "read stock_opname_items" on public.stock_opname_items for select to authenticated using (true);

-- Notifications: only own
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());

-- Audit log: admins only
drop policy if exists "read audit_logs" on public.audit_logs;
create policy "read audit_logs" on public.audit_logs for select to authenticated using (public.is_admin());

-- Users may update their own profile; admins manage everyone
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Admin writes (client side is protected by UI; server actions use service role)
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write locations" on public.locations;
create policy "admin write locations" on public.locations for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write items" on public.items;
create policy "admin write items" on public.items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write status history" on public.item_status_history;
create policy "admin write status history" on public.item_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write maintenance" on public.maintenance;
create policy "admin write maintenance" on public.maintenance for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write stock_opnames" on public.stock_opnames;
create policy "admin write stock_opnames" on public.stock_opnames for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write stock_opname_items" on public.stock_opname_items;
create policy "admin write stock_opname_items" on public.stock_opname_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- SEED DATA ----------

insert into public.roles (name, description) values
  ('admin', 'Full access to the system'),
  ('mechanic', 'Borrow / return / scan items'),
  ('supervisor', 'Monitoring and reports')
on conflict (name) do nothing;

insert into public.departments (name, description) values
  ('Team Mekanik', 'Maintenance and repair team'),
  ('Gudang', 'Warehouse and inventory'),
  ('Supervisor', 'Supervision and monitoring')
on conflict (name) do nothing;

insert into public.categories (name, description) values
  ('Alat Ukur', 'Measuring instruments'),
  ('Perkakas', 'Hand tools'),
  ('Alat Listrik', 'Electrical tools'),
  ('Komponen', 'Spare parts and components'),
  ('Keselamatan', 'Safety equipment')
on conflict (name) do nothing;

insert into public.locations (name, description) values
  ('Workshop A', 'Main workshop area A'),
  ('Workshop B', 'Main workshop area B'),
  ('Gudang Utama', 'Main warehouse'),
  ('Ruang Admin', 'Admin room storage')
on conflict (name) do nothing;
