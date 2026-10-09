-- NutriDay: tabelle personali, RLS attivo.
-- PRIMA DI ESEGUIRE: sostituisci YOUR_GOOGLE_EMAIL@example.com con la tua email Google.
create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  entries jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create table if not exists public.user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goals jsonb not null default '{"calories":2200,"protein":140,"carbs":250,"fat":70}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.daily_logs enable row level security;
alter table public.user_goals enable row level security;

drop policy if exists "Only approved user can read daily logs" on public.daily_logs;
drop policy if exists "Only approved user can insert daily logs" on public.daily_logs;
drop policy if exists "Only approved user can update daily logs" on public.daily_logs;
drop policy if exists "Only approved user can delete daily logs" on public.daily_logs;
drop policy if exists "Only approved user can manage goals" on public.user_goals;

create policy "Only approved user can read daily logs" on public.daily_logs for select to authenticated
using (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'));
create policy "Only approved user can insert daily logs" on public.daily_logs for insert to authenticated
with check (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'));
create policy "Only approved user can update daily logs" on public.daily_logs for update to authenticated
using (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'))
with check (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'));
create policy "Only approved user can delete daily logs" on public.daily_logs for delete to authenticated
using (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'));
create policy "Only approved user can manage goals" on public.user_goals for all to authenticated
using (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'))
with check (auth.uid() = user_id and lower(coalesce(auth.jwt()->>'email','')) = lower('YOUR_GOOGLE_EMAIL@example.com'));

grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.user_goals to authenticated;
