-- Sync table: stores all user localStorage data as a single JSON blob
create table public.user_sync_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_sync_data enable row level security;

create policy "Users can view own sync data"
  on public.user_sync_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own sync data"
  on public.user_sync_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sync data"
  on public.user_sync_data for update
  using (auth.uid() = user_id);
