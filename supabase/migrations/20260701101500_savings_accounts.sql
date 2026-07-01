create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'account' check (type in ('account', 'investment', 'card_limit', 'overdraft', 'cash', 'other')),
  amount numeric not null default 0,
  color text not null default '#22c55e',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists savings_accounts_user_id_idx on public.savings_accounts(user_id);

alter table public.savings_accounts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'Users can view their savings accounts'
  ) then
    create policy "Users can view their savings accounts"
      on public.savings_accounts for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'Users can insert their savings accounts'
  ) then
    create policy "Users can insert their savings accounts"
      on public.savings_accounts for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'Users can update their savings accounts'
  ) then
    create policy "Users can update their savings accounts"
      on public.savings_accounts for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'savings_accounts'
      and policyname = 'Users can delete their savings accounts'
  ) then
    create policy "Users can delete their savings accounts"
      on public.savings_accounts for delete
      using (auth.uid() = user_id);
  end if;
end $$;
