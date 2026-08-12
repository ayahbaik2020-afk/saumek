-- Run once on existing Supabase DB (SQL Editor).
-- Links borrowings to jobs for tool usage tracking.

alter table public.borrowings
  add column if not exists job_id uuid references public.jobs(id);

create index if not exists idx_borrowings_job on public.borrowings (job_id);
