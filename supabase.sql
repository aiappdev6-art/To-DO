-- Run this in the Supabase SQL editor.
-- Safe to re-run: drops and recreates everything.

drop trigger if exists trg_bump_streak on public.todo_checks;
drop trigger if exists set_todo_user_id on public.todos;
drop function if exists public.bump_streak();
drop function if exists public.set_todo_user_id();
drop table if exists public.todo_checks cascade;
drop table if exists public.user_streaks cascade;
drop table if exists public.todos cascade;
drop table if exists public.groups cascade;

-- Groups (categories)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Todos
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  task text not null check (char_length(task) > 0),
  priority smallint not null default 0 check (priority between 0 and 3),
  deadline timestamptz,
  created_at timestamptz not null default now()
);

-- Per-user checkmarks
create table public.todo_checks (
  todo_id uuid not null references public.todos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checked_at timestamptz not null default now(),
  primary key (todo_id, user_id)
);

-- Streaks
create table public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_check_date date
);

alter table public.groups enable row level security;
alter table public.todos enable row level security;
alter table public.todo_checks enable row level security;
alter table public.user_streaks enable row level security;

-- Groups: everyone reads, only auth users create, only owner edits/deletes
create policy "groups read all" on public.groups for select using (true);
create policy "groups insert auth" on public.groups for insert
  with check (auth.uid() is not null and auth.uid() = created_by);
create policy "groups update owner" on public.groups for update using (auth.uid() = created_by);
create policy "groups delete owner" on public.groups for delete using (auth.uid() = created_by);

-- Todos: everyone reads, only owner mutates
create policy "todos read all" on public.todos for select using (true);
create policy "todos insert auth" on public.todos for insert
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "todos update owner" on public.todos for update using (auth.uid() = user_id);
create policy "todos delete owner" on public.todos for delete using (auth.uid() = user_id);

-- Checks: everyone reads (so owners see who checked); each user manages own
create policy "checks read all" on public.todo_checks for select using (true);
create policy "checks insert self" on public.todo_checks for insert
  with check (auth.uid() = user_id);
create policy "checks delete self" on public.todo_checks for delete using (auth.uid() = user_id);

-- Streaks: each user reads/manages own
create policy "streaks read self" on public.user_streaks for select using (auth.uid() = user_id);
create policy "streaks upsert self" on public.user_streaks for insert
  with check (auth.uid() = user_id);
create policy "streaks update self" on public.user_streaks for update using (auth.uid() = user_id);

-- Auto-fill todos.user_id
create or replace function public.set_todo_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then new.user_id := auth.uid(); end if;
  return new;
end; $$;
create trigger set_todo_user_id before insert on public.todos
  for each row execute function public.set_todo_user_id();

-- Streak bump on check
create or replace function public.bump_streak()
returns trigger language plpgsql security definer as $$
declare
  today date := current_date;
  prev_date date;
  prev_streak int;
begin
  select last_check_date, current_streak into prev_date, prev_streak
    from public.user_streaks where user_id = new.user_id;
  if not found then
    insert into public.user_streaks(user_id, current_streak, longest_streak, last_check_date)
      values (new.user_id, 1, 1, today);
    return new;
  end if;
  if prev_date = today then return new; end if;
  if prev_date = today - 1 then
    update public.user_streaks
      set current_streak = prev_streak + 1,
          longest_streak = greatest(longest_streak, prev_streak + 1),
          last_check_date = today
      where user_id = new.user_id;
  else
    update public.user_streaks
      set current_streak = 1,
          longest_streak = greatest(longest_streak, 1),
          last_check_date = today
      where user_id = new.user_id;
  end if;
  return new;
end; $$;
create trigger trg_bump_streak after insert on public.todo_checks
  for each row execute function public.bump_streak();

-- View user emails (so owners can see "checked by ___"). RLS-safe.
-- We only expose id + email, and only for users referenced by todo_checks.
create or replace view public.checker_profiles
with (security_invoker = true) as
select u.id, u.email
from auth.users u
where exists (select 1 from public.todo_checks c where c.user_id = u.id);
