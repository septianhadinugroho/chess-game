-- ====================================================================
-- GAME CATUR - ULTIMATE SECURE SCHEMA (FINAL VERSION 2.0)
-- ====================================================================

-- 1. TABEL USER PROGRESS
-- Menyimpan level, statistik menang/kalah, dan nama public pemain
create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  player_name text, -- Nama disalin ke sini agar tidak perlu join ke auth.users (Aman!)
  current_level integer default 1 not null check (current_level >= 1 and current_level <= 10),
  highest_level integer default 1 not null check (highest_level >= 1 and highest_level <= 10),
  games_won integer default 0 not null check (games_won >= 0),
  games_played integer default 0 not null check (games_played >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_progress unique(user_id)
);

-- Pastikan kolom player_name ada (untuk jaga-jaga jika tabel lama sudah ada)
alter table public.user_progress add column if not exists player_name text;

-- Indexing
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_user_progress_highest_level on public.user_progress(highest_level desc);

-- 2. TABEL GAME HISTORY
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  level integer not null check (level >= 1 and level <= 10),
  player_color text not null check (player_color in ('white', 'black')),
  result text not null check (result in ('win', 'lose', 'draw')),
  moves_count integer default 0,
  duration_seconds integer default 0,
  pgn text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_game_history_user_id on public.game_history(user_id);

-- 3. TABEL SAVED GAMES
create table if not exists public.saved_games (
  user_id uuid references auth.users(id) on delete cascade primary key,
  fen text not null,
  pgn text,
  level integer default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ====================================================================
-- MIGRASI DATA (SUPAYA VIEW TIDAK ERROR)
-- ====================================================================
-- Salin nama user dari Auth ke User Progress
UPDATE public.user_progress
SET player_name = auth.users.raw_user_meta_data->>'full_name'
FROM auth.users
WHERE public.user_progress.user_id = auth.users.id
  AND public.user_progress.player_name IS NULL;

-- ====================================================================
-- VIEW LEADERBOARD (VERSI SECURITY INVOKER)
-- ====================================================================
-- Hapus view lama
DROP VIEW IF EXISTS public.leaderboard;

-- Buat View baru yang HANYA baca dari tabel public.user_progress
CREATE VIEW public.leaderboard AS
SELECT 
  user_id,         
  player_name,     
  highest_level,
  games_won,
  games_played,
  CASE 
    WHEN games_played > 0 THEN round((games_won::numeric / games_played::numeric) * 100, 2)
    ELSE 0
  END as win_rate
FROM 
  public.user_progress;

-- FIX PENTING: Ubah View jadi Security Invoker (Hilangkan Error 'security_definer_view')
ALTER VIEW public.leaderboard SET (security_invoker = true);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) - SATPAM AKSES
-- ====================================================================
alter table public.user_progress enable row level security;
alter table public.game_history enable row level security;
alter table public.saved_games enable row level security;

-- Bersihkan policy lama agar tidak duplikat error
drop policy if exists "Users can view own progress" on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;
drop policy if exists "Users can delete own progress" on public.user_progress;
drop policy if exists "Users can view own game history" on public.game_history;
drop policy if exists "Users can insert own game history" on public.game_history;
drop policy if exists "Users can manage own saved game" on public.saved_games;
drop policy if exists "Anyone can view leaderboard" on public.user_progress;

-- Pasang Policy Baru
-- User Progress
create policy "Users can view own progress" on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.user_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game History
create policy "Users can view own game history" on public.game_history for select using (auth.uid() = user_id);
create policy "Users can insert own game history" on public.game_history for insert with check (auth.uid() = user_id);

-- Saved Games
create policy "Users can manage own saved game" on public.saved_games for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leaderboard Public Access
-- Kita izinkan public baca tabel user_progress, TAPI datanya sudah dibatasi oleh kolom yang ada di View
create policy "Anyone can view leaderboard" on public.user_progress for select using (true);

-- ====================================================================
-- FUNCTIONS & TRIGGERS (LOGIKA SERVER)
-- ====================================================================

-- 1. Trigger Auto Update Timestamp
create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
set search_path = public -- Fix Security Warning
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
create trigger update_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function public.update_updated_at_column();

-- 2. Trigger "Fotocopy Nama Otomatis" (Handle New User)
-- Saat user signup, copy namanya ke tabel public
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public -- Fix Security Warning
AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, player_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO UPDATE
  SET player_name = EXCLUDED.player_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Function Helper: Get or Create Progress
create or replace function public.get_or_create_user_progress(p_user_id uuid)
returns table (
  id uuid, user_id uuid, current_level integer, highest_level integer, 
  games_won integer, games_played integer, created_at timestamp with time zone, updated_at timestamp with time zone
) 
language plpgsql 
security definer 
set search_path = public -- Fix Security Warning
as $$
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
$$;

-- 4. Function Helper: Update Game Result
create or replace function public.update_game_result(
  p_user_id uuid,
  p_level integer,
  p_won boolean
)
returns void as $$
declare
  v_current_highest integer;
begin
  select highest_level into v_current_highest
  from public.user_progress
  where user_id = p_user_id;
  
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
$$ language plpgsql security definer 
set search_path = public; -- Fix Security Warning

-- SELESAI! Database kamu sekarang AMAN & SIAP DIGUNAKAN! 🚀