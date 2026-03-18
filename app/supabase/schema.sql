-- ============================================================
-- Human Skill Tree — Supabase Database Schema
-- ============================================================

-- 1. User Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'admin')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. User Progress (XP, level, streak)
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  skill_progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- 3. Chat Sessions
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  tutor_key text,
  title text,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

create policy "Users can manage own sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id);

-- 4. Chat Messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tutor_key text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage own messages"
  on public.chat_messages for all
  using (auth.uid() = user_id);

-- Index for fast message retrieval by session
create index idx_chat_messages_session on public.chat_messages(session_id, created_at);

-- 5. Knowledge Points
create table public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  concept text not null,
  taught_by text,
  mastery integer not null default 0 check (mastery between 0 and 100),
  review_box integer not null default 0,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, skill_slug, concept)
);

alter table public.knowledge_points enable row level security;

create policy "Users can manage own knowledge points"
  on public.knowledge_points for all
  using (auth.uid() = user_id);

-- 6. Tutor Memory (per tutor per skill)
create table public.tutor_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tutor_key text not null,
  skill_slug text not null,
  taught_topics text[] not null default '{}',
  stuck_points text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tutor_key, skill_slug)
);

alter table public.tutor_memory enable row level security;

create policy "Users can manage own tutor memory"
  on public.tutor_memory for all
  using (auth.uid() = user_id);

-- 7. Tutor Attitudes (cross-skill, per tutor)
create table public.tutor_attitudes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tutor_key text not null,
  skill_slug text,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.tutor_attitudes enable row level security;

create policy "Users can manage own tutor attitudes"
  on public.tutor_attitudes for all
  using (auth.uid() = user_id);

-- Index for fast attitude lookup by tutor
create index idx_tutor_attitudes_user_tutor on public.tutor_attitudes(user_id, tutor_key, created_at desc);

-- 8. Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  content text not null,
  source text not null default 'manual' check (source in ('manual', 'auto')),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid() = user_id);

-- 9. Social Content (group chat + diary)
create table public.social_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  type text not null check (type in ('group_chat', 'diary')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.social_content enable row level security;

create policy "Users can manage own social content"
  on public.social_content for all
  using (auth.uid() = user_id);

-- 10. Usage Logs (for rate limiting & analytics)
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('message', 'login', 'review', 'social_gen')),
  skill_slug text,
  tokens_used integer default 0,
  created_at timestamptz not null default now()
);

alter table public.usage_logs enable row level security;

create policy "Users can view own usage"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

-- Index for fast daily usage counting
create index idx_usage_logs_user_date on public.usage_logs(user_id, created_at);

-- 11. Payments (for tracking payment history)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'CNY',
  provider text not null check (provider in ('lemonsqueezy', 'aifadian', 'manual')),
  provider_tx_id text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'refunded')),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- 12. Classroom Sessions
create table public.classroom_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  mode text not null check (mode in ('classroom', 'pbl')),
  agents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.classroom_sessions enable row level security;

create policy "Users can manage own classroom sessions"
  on public.classroom_sessions for all
  using (auth.uid() = user_id);

-- 13. Slides
create table public.slides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  title text,
  slides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.slides enable row level security;

create policy "Users can manage own slides"
  on public.slides for all
  using (auth.uid() = user_id);

-- 14. PBL Projects
create table public.pbl_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_slug text not null,
  template_id text,
  milestones jsonb not null default '[]'::jsonb,
  current_milestone integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pbl_projects enable row level security;

create policy "Users can manage own pbl projects"
  on public.pbl_projects for all
  using (auth.uid() = user_id);

-- 15. Uploaded Documents
create table public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  content_text text,
  course_outline jsonb,
  created_at timestamptz not null default now()
);

alter table public.uploaded_documents enable row level security;

create policy "Users can manage own documents"
  on public.uploaded_documents for all
  using (auth.uid() = user_id);

-- ============================================================
-- Leaderboard View (public, read-only)
-- ============================================================
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.avatar_url,
  up.xp,
  up.level,
  up.current_streak,
  up.longest_streak
from public.profiles p
join public.user_progress up on p.id = up.user_id
where p.plan != 'admin'
order by up.xp desc
limit 100;
