-- NutriDay: abilita più account Google mantenendo i dati separati per utente.
-- Eseguire una sola volta in Supabase > SQL Editor.
-- Non elimina tabelle né righe: sostituisce solo le policy di accesso.

alter table public.daily_logs enable row level security;
alter table public.user_goals enable row level security;

drop policy if exists "Only approved user can read daily logs" on public.daily_logs;
drop policy if exists "Only approved user can insert daily logs" on public.daily_logs;
drop policy if exists "Only approved user can update daily logs" on public.daily_logs;
drop policy if exists "Only approved user can delete daily logs" on public.daily_logs;
drop policy if exists "Only approved user can manage goals" on public.user_goals;

drop policy if exists "Users can read own daily logs" on public.daily_logs;
drop policy if exists "Users can insert own daily logs" on public.daily_logs;
drop policy if exists "Users can update own daily logs" on public.daily_logs;
drop policy if exists "Users can delete own daily logs" on public.daily_logs;
drop policy if exists "Users can manage own goals" on public.user_goals;

create policy "Users can read own daily logs"
on public.daily_logs for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own daily logs"
on public.daily_logs for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own daily logs"
on public.daily_logs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own daily logs"
on public.daily_logs for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can manage own goals"
on public.user_goals for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.user_goals to authenticated;
