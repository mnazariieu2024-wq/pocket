-- Pocket — database schema
-- Paste this whole file into Supabase: SQL Editor → New query → Run.
-- It is safe to run more than once.

-- 1. Expenses: one row per thing a student spends money on.
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 200),
  amount      numeric(10, 2) not null default 0 check (amount >= 0 and amount < 1000000),
  category    text not null default 'Other',
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_user_spent_idx
  on public.expenses (user_id, spent_on desc, created_at desc);

-- 2. Budgets: one monthly budget per user.
create table if not exists public.budgets (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  monthly_amount numeric(10, 2) not null default 0 check (monthly_amount >= 0 and monthly_amount < 1000000),
  updated_at     timestamptz not null default now()
);

-- 3. Row Level Security: every user only ever sees and changes their own rows.
alter table public.expenses enable row level security;
alter table public.budgets  enable row level security;

drop policy if exists "Users read own expenses"   on public.expenses;
drop policy if exists "Users insert own expenses" on public.expenses;
drop policy if exists "Users update own expenses" on public.expenses;
drop policy if exists "Users delete own expenses" on public.expenses;

create policy "Users read own expenses"   on public.expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own expenses" on public.expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own expenses" on public.expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own expenses" on public.expenses for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read own budget"   on public.budgets;
drop policy if exists "Users insert own budget" on public.budgets;
drop policy if exists "Users update own budget" on public.budgets;

create policy "Users read own budget"   on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own budget" on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own budget" on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 4. Logged-out visitors (the "anon" role) get no access at all.
revoke all on public.expenses from anon;
revoke all on public.budgets  from anon;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update on public.budgets to authenticated;

-- 5. Savings goals (added in v2): e.g. "Summer trip €600".
create table if not exists public.savings_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 80),
  emoji         text not null default '🎯',
  target_amount numeric(10, 2) not null check (target_amount > 0 and target_amount < 1000000),
  saved_amount  numeric(10, 2) not null default 0 check (saved_amount >= 0 and saved_amount < 1000000),
  target_date   date,
  created_at    timestamptz not null default now()
);

alter table public.savings_goals enable row level security;

drop policy if exists "Users read own goals"   on public.savings_goals;
drop policy if exists "Users insert own goals" on public.savings_goals;
drop policy if exists "Users update own goals" on public.savings_goals;
drop policy if exists "Users delete own goals" on public.savings_goals;

create policy "Users read own goals"   on public.savings_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own goals" on public.savings_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own goals" on public.savings_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own goals" on public.savings_goals for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.savings_goals from anon;
grant select, insert, update, delete on public.savings_goals to authenticated;
