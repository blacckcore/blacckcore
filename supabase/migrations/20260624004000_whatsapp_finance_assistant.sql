alter table public.expenses
  add column if not exists payment_method text,
  add column if not exists whatsapp_category text;

alter table public.debts
  add column if not exists paid_amount numeric not null default 0,
  add column if not exists status text not null default 'active';

create table if not exists public.savings_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null default 0,
  type text not null check (type in ('add', 'remove', 'set')),
  previous_amount numeric not null default 0,
  new_amount numeric not null default 0,
  description text,
  created_at timestamptz not null default now()
);

alter table public.savings_movements enable row level security;

drop policy if exists "Users can view own savings movements" on public.savings_movements;
drop policy if exists "Users can insert own savings movements" on public.savings_movements;
drop policy if exists "Users can update own savings movements" on public.savings_movements;

create policy "Users can view own savings movements"
  on public.savings_movements
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own savings movements"
  on public.savings_movements
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own savings movements"
  on public.savings_movements
  for update
  using (auth.uid() = user_id);

create index if not exists savings_movements_user_created_idx
  on public.savings_movements (user_id, created_at desc);
