-- ============================================
-- GAME CATUR - SUPABASE DATABASE SCHEMA
-- ============================================
-- Copy dan paste ke Supabase SQL Editor
-- Jalankan satu per satu atau sekaligus

-- ============================================
-- 1. USER PROGRESS TABLE
-- ============================================
-- Tabel untuk menyimpan progress pemain
create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  current_level integer default 1 not null check (current_level >= 1 and current_level <= 10),
  highest_level integer default 1 not null check (highest_level >= 1 and highest_level <= 10),
  games_won integer default 0 not null check (games_won >= 0),
  games_played integer default 0 not null check (games_played >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_progress unique(user_id)
);

-- Index untuk performa
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_user_progress_highest_level on public.user_progress(highest_level desc);

-- Trigger untuk auto-update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function update_updated_at_column();


-- ============================================
-- 2. GAME HISTORY TABLE
-- ============================================
-- Untuk menyimpan history permainan
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  level integer not null check (level >= 1 and level <= 10),
  player_color text not null check (player_color in ('white', 'black')),
  result text not null check (result in ('win', 'lose', 'draw')),
  moves_count integer default 0,
  duration_seconds integer default 0,
  pgn text, -- Chess PGN notation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index untuk performa
create index if not exists idx_game_history_user_id on public.game_history(user_id);
create index if not exists idx_game_history_level on public.game_history(level);
create index if not exists idx_game_history_created_at on public.game_history(created_at desc);


-- ============================================
-- 3. LEADERBOARD VIEW
-- ============================================
-- View untuk menampilkan leaderboard global
create or replace view public.leaderboard as
select 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as player_name,
  up.highest_level,
  up.games_won,
  up.games_played,
  case 
    when up.games_played > 0 then round((up.games_won::numeric / up.games_played::numeric) * 100, 2)
    else 0
  end as win_rate,
  up.updated_at
from 
  public.user_progress up
  join auth.users u on up.user_id = u.id
order by 
  up.highest_level desc,
  up.games_won desc,
  win_rate desc;


-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
alter table public.user_progress enable row level security;
alter table public.game_history enable row level security;

-- USER PROGRESS POLICIES
-- Users dapat melihat progress mereka sendiri
create policy "Users can view own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

-- Users dapat insert progress mereka sendiri
create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

-- Users dapat update progress mereka sendiri
create policy "Users can update own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users dapat delete progress mereka sendiri
create policy "Users can delete own progress"
  on public.user_progress
  for delete
  using (auth.uid() = user_id);


-- GAME HISTORY POLICIES
-- Users dapat melihat history mereka sendiri
create policy "Users can view own game history"
  on public.game_history
  for select
  using (auth.uid() = user_id);

-- Users dapat insert history mereka sendiri
create policy "Users can insert own game history"
  on public.game_history
  for insert
  with check (auth.uid() = user_id);

-- Public dapat melihat leaderboard
create policy "Anyone can view leaderboard"
  on public.user_progress
  for select
  using (true);


-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function untuk get atau create user progress
create or replace function public.get_or_create_user_progress(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  current_level integer,
  highest_level integer,
  games_won integer,
  games_played integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) as $$
begin
  return query
  insert into public.user_progress (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing
  returning *;
  
  if not found then
    return query
    select * from public.user_progress where user_progress.user_id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- Function untuk update progress setelah game
create or replace function public.update_game_result(
  p_user_id uuid,
  p_level integer,
  p_won boolean
)
returns void as $$
declare
  v_current_highest integer;
begin
  -- Get current highest level
  select highest_level into v_current_highest
  from public.user_progress
  where user_id = p_user_id;
  
  -- Update progress
  update public.user_progress
  set 
    games_played = games_played + 1,
    games_won = games_won + case when p_won then 1 else 0 end,
    highest_level = case 
      when p_won and p_level < 10 then greatest(v_current_highest, p_level + 1)
      else v_current_highest
    end,
    updated_at = timezone('utc'::text, now())
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;


-- ============================================
-- 6. INITIAL DATA / SEED
-- ============================================
-- Uncomment untuk testing
-- insert into public.user_progress (user_id, highest_level, games_won, games_played)
-- values 
--   (gen_random_uuid(), 5, 20, 30),
--   (gen_random_uuid(), 8, 45, 60),
--   (gen_random_uuid(), 10, 100, 120);


-- ============================================
-- 7. USEFUL QUERIES FOR DEBUGGING
-- ============================================

-- Query untuk lihat semua user progress
-- select * from public.user_progress order by highest_level desc;

-- Query untuk lihat leaderboard
-- select * from public.leaderboard limit 10;

-- Query untuk lihat game history specific user
-- select * from public.game_history 
-- where user_id = 'user-uuid-here' 
-- order by created_at desc;

-- Query untuk analytics
-- select 
--   level,
--   count(*) as total_games,
--   sum(case when result = 'win' then 1 else 0 end) as wins,
--   sum(case when result = 'lose' then 1 else 0 end) as losses,
--   sum(case when result = 'draw' then 1 else 0 end) as draws
-- from public.game_history
-- group by level
-- order by level;


-- ============================================
-- SELESAI! 🎉
-- ============================================
-- Schema sudah siap digunakan!
-- 
-- Next steps:
-- 1. Copy .env.local.example ke .env.local
-- 2. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 3. Enable Google Auth di Supabase Dashboard
-- 4. Test login dan main game!
-- ============================================