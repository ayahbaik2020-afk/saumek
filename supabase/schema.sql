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
  role text not null default 'mechanic' check (role in ('admin','mechanic','supervisor','foreman','management')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support roles added after initial creation
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','mechanic','supervisor','foreman','management'));

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
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','BORROWED','MAINTENANCE','DAMAGED','LOST','INACTIVE','RESERVED')),
  photo_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support RESERVED status added for job tool planning
alter table public.items drop constraint if exists items_status_check;
alter table public.items add constraint items_status_check check (status in ('AVAILABLE','BORROWED','MAINTENANCE','DAMAGED','LOST','INACTIVE','RESERVED'));

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

-- ---------- EMPLOYEES / PEOPLE (PRD v2) ----------

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  nik text unique,
  name text not null,
  photo_url text,
  position text,
  department_id uuid references public.departments(id),
  education text,
  grade text,
  join_date date,
  employment_status text not null default 'ACTIVE' check (employment_status in ('ACTIVE','INACTIVE','CONTRACT','PROBATION')),
  qr_code text unique,
  contact text,
  notes text,
  profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_skills (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  level text not null default 'INTERMEDIATE' check (level in ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT')),
  status text not null default 'VERIFIED' check (status in ('VERIFIED','PENDING','EXPIRED')),
  verified_at timestamptz,
  notes text,
  unique (employee_id, skill_id),
  created_at timestamptz not null default now()
);

create table if not exists public.certificate_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_certificates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  certificate_name text not null,
  certificate_number text,
  issuer text,
  issue_date date,
  expiry_date date,
  certificate_type_id uuid references public.certificate_types(id),
  file_url text,
  status text not null default 'VALID' check (status in ('VALID','EXPIRING_SOON','EXPIRED')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_developments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  goal text not null,
  target_skill_id uuid references public.skills(id),
  required_training text,
  target_certificate text,
  target_date date,
  status text not null default 'PLANNED' check (status in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_violations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  violation_date date not null default current_date,
  category text not null default 'APD' check (category in ('APD','SAFETY','DISCIPLINE','PROCEDURE','ATTENDANCE','OTHER')),
  violation text not null,
  description text,
  severity text not null default 'MINOR' check (severity in ('MINOR','MAJOR','CRITICAL')),
  action text,
  pic text,
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED','RESOLVED')),
  attachment_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- ITEM UNITS (serialized tools, PRD v2) ----------

create table if not exists public.item_units (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  unit_code text not null unique,
  serial_number text,
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','RESERVED','BORROWED','MAINTENANCE','DAMAGED','LOST','INACTIVE')),
  condition text not null default 'GOOD' check (condition in ('GOOD','LIGHT_DAMAGE','HEAVY_DAMAGE','MAINTENANCE','LOST')),
  location_id uuid references public.locations(id),
  qr_code text unique,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- WORK ORDERS & JOBS (PRD v2) ----------

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  wo_number text not null unique,
  job_title text not null,
  plant text,
  area text,
  location text,
  requester text,
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  planned_date date,
  deadline date,
  description text,
  status text not null default 'OPEN' check (status in ('OPEN','PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique,
  wo_id uuid references public.work_orders(id),
  title text not null,
  description text,
  plant text,
  area text,
  location text,
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  pic_id uuid references public.employees(id),
  supervisor_id uuid references public.employees(id),
  planned_start date,
  planned_finish date,
  actual_start timestamptz,
  actual_finish timestamptz,
  status text not null default 'PLANNED' check (status in ('PLANNED','READY','IN_PROGRESS','PENDING','COMPLETED','CANCELLED')),
  progress numeric not null default 0 check (progress between 0 and 100),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_manpower (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  role text,
  is_pic boolean not null default false,
  created_at timestamptz not null default now(),
  unique (job_id, employee_id)
);

create table if not exists public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid references public.skills(id),
  required_level text check (required_level in ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT')),
  required_certificate text,
  created_at timestamptz not null default now()
);

create table if not exists public.job_tools (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity numeric not null default 1 check (quantity > 0),
  status text not null default 'REQUIRED' check (status in ('REQUIRED','RESERVED','ISSUED','RETURNED','CANCELLED')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.job_permits (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  permit_number text,
  permit_type text not null default 'WORK_PERMIT' check (permit_type in ('WORK_PERMIT','HOT_WORK','WORKING_AT_HEIGHT','CONFINED_SPACE','LIFTING','ELECTRICAL','OTHER')),
  issue_date date,
  expiry_date date,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','EXPIRED','REJECTED','NOT_REQUIRED')),
  approved_by text,
  attachment_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.job_checklists (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  item text not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.job_progress (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  progress_date date not null default current_date,
  progress numeric not null default 0 check (progress between 0 and 100),
  issue text,
  safety_issue text,
  photo_urls jsonb,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.job_daily_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  report_date date not null default current_date,
  work_progress text,
  actual_work text,
  manpower text,
  tools text,
  material text,
  problem text,
  safety_issue text,
  before_photo text,
  progress_photo text,
  after_photo text,
  notes text,
  created_by uuid references public.profiles(id),
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

-- Generate yearly code, e.g. WO-2026-00125 / JOB-2026-00001 / EMP-0001
create or replace function public.generate_code(prefix text, width int default 5)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  year_key text := prefix || '-' || to_char(now(), 'YYYY');
  seq bigint;
  result text;
begin
  insert into public.number_sequences (key, last_value)
  values (year_key, 1)
  on conflict (key)
  do update set last_value = public.number_sequences.last_value + 1,
                updated_at = now()
  returning last_value into seq;

  result := prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(seq::text, width, '0');
  return result;
end;
$$;

-- Certificate status helper
create or replace function public.certificate_status(expiry date)
returns text
language sql
immutable
as $$
  select case
    when expiry is null then 'VALID'
    when expiry < current_date then 'EXPIRED'
    when expiry <= current_date + 30 then 'EXPIRING_SOON'
    else 'VALID'
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

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(current_role() in ('admin','supervisor','foreman'), false);
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

create trigger set_updated_at before update on public.employees
for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.work_orders
for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.jobs
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
create index if not exists idx_employees_id on public.employees (employee_id);
create index if not exists idx_employees_dept on public.employees (department_id);
create index if not exists idx_emp_skills_employee on public.employee_skills (employee_id);
create index if not exists idx_emp_certs_employee on public.employee_certificates (employee_id);
create index if not exists idx_emp_dev_employee on public.employee_developments (employee_id);
create index if not exists idx_emp_viol_employee on public.employee_violations (employee_id);
create index if not exists idx_item_units_item on public.item_units (item_id);
create index if not exists idx_jobs_status on public.jobs (status);
create index if not exists idx_jobs_planned on public.jobs (planned_start);
create index if not exists idx_wo_number on public.work_orders (wo_number);
create index if not exists idx_job_manpower_job on public.job_manpower (job_id);
create index if not exists idx_job_tools_job on public.job_tools (job_id);

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
alter table public.employees enable row level security;
alter table public.skills enable row level security;
alter table public.employee_skills enable row level security;
alter table public.certificate_types enable row level security;
alter table public.employee_certificates enable row level security;
alter table public.employee_developments enable row level security;
alter table public.employee_violations enable row level security;
alter table public.item_units enable row level security;
alter table public.work_orders enable row level security;
alter table public.jobs enable row level security;
alter table public.job_manpower enable row level security;
alter table public.job_requirements enable row level security;
alter table public.job_tools enable row level security;
alter table public.job_permits enable row level security;
alter table public.job_checklists enable row level security;
alter table public.job_progress enable row level security;
alter table public.job_daily_reports enable row level security;

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

drop policy if exists "read employees" on public.employees;
create policy "read employees" on public.employees for select to authenticated using (true);

drop policy if exists "read skills" on public.skills;
create policy "read skills" on public.skills for select to authenticated using (true);

drop policy if exists "read employee_skills" on public.employee_skills;
create policy "read employee_skills" on public.employee_skills for select to authenticated using (true);

drop policy if exists "read certificate_types" on public.certificate_types;
create policy "read certificate_types" on public.certificate_types for select to authenticated using (true);

drop policy if exists "read employee_certificates" on public.employee_certificates;
create policy "read employee_certificates" on public.employee_certificates for select to authenticated using (true);

drop policy if exists "read employee_developments" on public.employee_developments;
create policy "read employee_developments" on public.employee_developments for select to authenticated using (true);

drop policy if exists "read employee_violations" on public.employee_violations;
create policy "read employee_violations" on public.employee_violations for select to authenticated using (true);

drop policy if exists "read item_units" on public.item_units;
create policy "read item_units" on public.item_units for select to authenticated using (true);

drop policy if exists "read work_orders" on public.work_orders;
create policy "read work_orders" on public.work_orders for select to authenticated using (true);

drop policy if exists "read jobs" on public.jobs;
create policy "read jobs" on public.jobs for select to authenticated using (true);

drop policy if exists "read job_manpower" on public.job_manpower;
create policy "read job_manpower" on public.job_manpower for select to authenticated using (true);

drop policy if exists "read job_requirements" on public.job_requirements;
create policy "read job_requirements" on public.job_requirements for select to authenticated using (true);

drop policy if exists "read job_tools" on public.job_tools;
create policy "read job_tools" on public.job_tools for select to authenticated using (true);

drop policy if exists "read job_permits" on public.job_permits;
create policy "read job_permits" on public.job_permits for select to authenticated using (true);

drop policy if exists "read job_checklists" on public.job_checklists;
create policy "read job_checklists" on public.job_checklists for select to authenticated using (true);

drop policy if exists "read job_progress" on public.job_progress;
create policy "read job_progress" on public.job_progress for select to authenticated using (true);

drop policy if exists "read job_daily_reports" on public.job_daily_reports;
create policy "read job_daily_reports" on public.job_daily_reports for select to authenticated using (true);

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

drop policy if exists "admin write employees" on public.employees;
create policy "admin write employees" on public.employees for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write skills" on public.skills;
create policy "admin write skills" on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write employee_skills" on public.employee_skills;
create policy "admin write employee_skills" on public.employee_skills for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write certificate_types" on public.certificate_types;
create policy "admin write certificate_types" on public.certificate_types for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write employee_certificates" on public.employee_certificates;
create policy "admin write employee_certificates" on public.employee_certificates for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write employee_developments" on public.employee_developments;
create policy "admin write employee_developments" on public.employee_developments for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write employee_violations" on public.employee_violations;
create policy "admin write employee_violations" on public.employee_violations for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write item_units" on public.item_units;
create policy "admin write item_units" on public.item_units for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Jobs / WO: managers (admin, supervisor, foreman)
drop policy if exists "manager write work_orders" on public.work_orders;
create policy "manager write work_orders" on public.work_orders for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write jobs" on public.jobs;
create policy "manager write jobs" on public.jobs for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write job_manpower" on public.job_manpower;
create policy "manager write job_manpower" on public.job_manpower for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write job_requirements" on public.job_requirements;
create policy "manager write job_requirements" on public.job_requirements for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write job_tools" on public.job_tools;
create policy "manager write job_tools" on public.job_tools for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write job_permits" on public.job_permits;
create policy "manager write job_permits" on public.job_permits for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "manager write job_checklists" on public.job_checklists;
create policy "manager write job_checklists" on public.job_checklists for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Job execution updates allowed for all authenticated (mechanics update progress/reports)
drop policy if exists "write job_progress" on public.job_progress;
create policy "write job_progress" on public.job_progress for all to authenticated using (true) with check (true);

drop policy if exists "write job_daily_reports" on public.job_daily_reports;
create policy "write job_daily_reports" on public.job_daily_reports for all to authenticated using (true) with check (true);

-- ---------- SEED DATA ----------

insert into public.roles (name, description) values
  ('admin', 'Full access to the system'),
  ('mechanic', 'Borrow / return / scan items'),
  ('supervisor', 'Monitoring and reports'),
  ('foreman', 'Job planning and manpower'),
  ('management', 'Read-only management dashboard')
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

insert into public.skills (name, category) values
  ('SMAW', 'Welding'),
  ('GTAW', 'Welding'),
  ('Fitter', 'Mechanical'),
  ('Welder', 'Welding'),
  ('Scaffolder', 'Support'),
  ('Rigger', 'Support'),
  ('Driver Forklift', 'Support'),
  ('Tool Keeper', 'Inventory'),
  ('Non Metal', 'Mechanical'),
  ('Weight Lifting Arrangement', 'Support')
on conflict (name) do nothing;

insert into public.certificate_types (name, description) values
  ('Welding', 'Sertifikat pengelasan'),
  ('Scaffolding', 'Sertifikat scaffolding'),
  ('Rigging', 'Sertifikat rigging'),
  ('Forklift', 'Lisensi operator forklift'),
  ('TKBT', 'Tenaga Kerja Bangunan Tinggi'),
  ('First Aid', 'Pertolongan pertama'),
  ('Safety', 'Sertifikat keselamatan kerja')
on conflict (name) do nothing;

insert into public.job_checklists (job_id, item, is_required, sort)
select j.id, c.item, true, c.sort
from public.jobs j
cross join (values
  ('WO tersedia', 1),
  ('Manpower tersedia', 2),
  ('Tool tersedia', 3),
  ('Permit tersedia', 4),
  ('JSA tersedia', 5),
  ('APD tersedia', 6),
  ('Toolbox Meeting', 7),
  ('Area siap', 8),
  ('Material tersedia', 9)
) as c(item, sort)
where not exists (select 1 from public.job_checklists jc where jc.job_id = j.id);
