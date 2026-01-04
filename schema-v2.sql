-- ====================================================================
-- GAME CATUR V2 - MULTIPLAYER & PWA READY SCHEMA
-- ====================================================================
-- Jalankan script ini di Supabase SQL Editor SETELAH schema lama

-- ============================================
-- 1. TABEL GAME ROOMS (Multiplayer)
-- ============================================
create table if not exists public.game_rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text unique not null,
  host_user_id uuid references auth.users(id) on delete cascade not null,
  guest_user_id uuid references auth.users(id) on delete cascade,
  status text not null check (status in ('waiting', 'playing', 'finished')) default 'waiting',
  host_color text check (host_color in ('white', 'black')),
  current_fen text default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text,
  winner_id uuid references auth.users(id) on delete set null,
  result text check (result in ('win', 'lose', 'draw', 'abandoned')),
  time_control integer default 600, -- seconds per player (10 minutes default)
  white_time_left integer default 600,
  black_time_left integer default 600,
  last_move_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index untuk performa
create index if not exists idx_game_rooms_room_code on public.game_rooms(room_code);
create index if not exists idx_game_rooms_status on public.game_rooms(status);
create index if not exists idx_game_rooms_host on public.game_rooms(host_user_id);

-- ============================================
-- 2. TABEL GAME MOVES (History untuk Multiplayer)
-- ============================================
create table if not exists public.game_moves (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.game_rooms(id) on delete cascade not null,
  move_number integer not null,
  player_color text not null check (player_color in ('white', 'black')),
  from_square text not null,
  to_square text not null,
  piece text not null,
  captured_piece text,
  is_castle boolean default false,
  is_en_passant boolean default false,
  promotion text,
  fen_after text not null,
  time_taken integer, -- seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_game_moves_room on public.game_moves(room_id);
create index if not exists idx_game_moves_created on public.game_moves(created_at desc);

-- ============================================
-- 3. TABEL SPECTATORS (Penonton)
-- ============================================
create table if not exists public.room_spectators (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.game_rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

create index if not exists idx_spectators_room on public.room_spectators(room_id);

-- ============================================
-- 4. UPDATE TABEL USER PROGRESS (Tambah Stats Multiplayer)
-- ============================================
alter table public.user_progress 
  add column if not exists multiplayer_wins integer default 0 check (multiplayer_wins >= 0),
  add column if not exists multiplayer_played integer default 0 check (multiplayer_played >= 0),
  add column if not exists rating integer default 1200 check (rating >= 0);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS untuk tabel baru
alter table public.game_rooms enable row level security;
alter table public.game_moves enable row level security;
alter table public.room_spectators enable row level security;

-- GAME ROOMS POLICIES
create policy "Anyone can view active rooms"
  on public.game_rooms for select
  using (status in ('waiting', 'playing'));

create policy "Users can create rooms"
  on public.game_rooms for insert
  with check (auth.uid() = host_user_id);

create policy "Host and guest can update their room"
  on public.game_rooms for update
  using (auth.uid() in (host_user_id, guest_user_id))
  with check (auth.uid() in (host_user_id, guest_user_id));

-- GAME MOVES POLICIES
create policy "Anyone can view moves in active rooms"
  on public.game_moves for select
  using (
    exists (
      select 1 from public.game_rooms 
      where id = room_id 
      and status in ('waiting', 'playing')
    )
  );

create policy "Room players can insert moves"
  on public.game_moves for insert
  with check (
    exists (
      select 1 from public.game_rooms 
      where id = room_id 
      and auth.uid() in (host_user_id, guest_user_id)
    )
  );

-- SPECTATORS POLICIES
create policy "Anyone can view spectators"
  on public.room_spectators for select
  using (true);

create policy "Users can join as spectator"
  on public.room_spectators for insert
  with check (auth.uid() = user_id);

create policy "Users can leave spectating"
  on public.room_spectators for delete
  using (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function untuk generate room code yang unik
create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists boolean;
begin
  loop
    -- Generate 6 karakter random (A-Z, 0-9)
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Cek apakah code sudah ada
    select count(*) > 0 into exists
    from public.game_rooms
    where room_code = code;
    
    exit when not exists;
  end loop;
  
  return code;
end;
$$;

-- Trigger auto update timestamp untuk game_rooms
create trigger update_game_rooms_updated_at
  before update on public.game_rooms
  for each row
  execute function update_updated_at_column();

-- Function untuk cleanup room yang abandoned
create or replace function cleanup_abandoned_rooms()
returns void
language plpgsql
security definer
as $$
begin
  update public.game_rooms
  set 
    status = 'finished',
    result = 'abandoned'
  where 
    status in ('waiting', 'playing')
    and updated_at < now() - interval '1 hour';
end;
$$;

-- Function untuk update rating (Simple ELO-like system)
create or replace function update_player_ratings(
  winner_id uuid,
  loser_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  winner_rating integer;
  loser_rating integer;
  winner_expected numeric;
  loser_expected numeric;
  k_factor integer := 32;
  winner_new_rating integer;
  loser_new_rating integer;
begin
  -- Get current ratings
  select rating into winner_rating from public.user_progress where user_id = winner_id;
  select rating into loser_rating from public.user_progress where user_id = loser_id;
  
  -- Calculate expected scores
  winner_expected := 1.0 / (1.0 + power(10.0, (loser_rating - winner_rating) / 400.0));
  loser_expected := 1.0 - winner_expected;
  
  -- Calculate new ratings
  winner_new_rating := winner_rating + round(k_factor * (1.0 - winner_expected));
  loser_new_rating := loser_rating + round(k_factor * (0.0 - loser_expected));
  
  -- Update ratings
  update public.user_progress 
  set rating = winner_new_rating 
  where user_id = winner_id;
  
  update public.user_progress 
  set rating = loser_new_rating 
  where user_id = loser_id;
end;
$$;

-- ============================================
-- 7. REALTIME SUBSCRIPTIONS (ENABLE)
-- ============================================
-- Run ini di Dashboard > Settings > API > Realtime
-- Atau bisa juga via SQL:

-- Enable realtime untuk game_rooms
alter publication supabase_realtime add table public.game_rooms;

-- Enable realtime untuk game_moves
alter publication supabase_realtime add table public.game_moves;

-- Enable realtime untuk spectators
alter publication supabase_realtime add table public.room_spectators;

-- ============================================
-- 8. USEFUL QUERIES FOR TESTING
-- ============================================

-- Query untuk lihat semua active rooms
-- select * from public.game_rooms where status = 'waiting' order by created_at desc;

-- Query untuk lihat history moves di room
-- select * from public.game_moves where room_id = 'room-uuid-here' order by move_number;

-- Query untuk cleanup old rooms (run manual atau via cron)
-- select cleanup_abandoned_rooms();

-- ============================================
-- SELESAI! 🎉
-- ============================================
-- Schema V2 sudah siap untuk:
-- ✅ Multiplayer Online
-- ✅ Room System dengan Code
-- ✅ Spectator Mode
-- ✅ Move History
-- ✅ Timer System
-- ✅ Rating System
-- ✅ Realtime Updates
-- ============================================