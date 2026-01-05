// Room status types
export type RoomStatus = 'waiting' | 'playing' | 'finished';

// Game result types
export type GameResult = 'win' | 'lose' | 'draw' | 'abandoned' | 'timeout';

// Player color types
export type PlayerColor = 'white' | 'black';

// Move flag types
export type MoveFlag = 'n' | 'c' | 'b' | 'e' | 'p' | 'k' | 'q';

// Game room interface
export interface GameRoom {
  id: string;
  room_code: string;
  host_user_id: string;
  guest_user_id: string | null;
  status: RoomStatus;
  host_color: PlayerColor | null;
  current_fen: string;
  pgn: string | null;
  winner_id: string | null;
  result: GameResult | null;
  time_control: number;
  white_time_left: number;
  black_time_left: number;
  last_move_at: string;
  created_at: string;
  updated_at: string;
}

// Game move interface
export interface GameMove {
  id: string;
  room_id: string;
  move_number: number;
  player_color: PlayerColor;
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece: string | null;
  is_castle: boolean;
  is_en_passant: boolean;
  promotion: string | null;
  fen_after: string;
  time_taken: number | null;
  created_at: string;
}

// Spectator interface
export interface RoomSpectator {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

// User progress with multiplayer stats
export interface UserProgress {
  id: string;
  user_id: string;
  player_name: string | null;
  current_level: number;
  highest_level: number;
  games_won: number;
  games_played: number;
  multiplayer_wins: number;
  multiplayer_played: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  user_id: string;
  player_name: string;
  highest_level: number;
  games_won: number;
  games_played: number;
  win_rate: number;
  rating?: number;
  multiplayer_wins?: number;
}

// Room creation params
export interface CreateRoomParams {
  host_user_id: string;
  time_control: number;
}

// Room join params
export interface JoinRoomParams {
  room_code: string;
  guest_user_id: string;
}

// Move submission params
export interface SubmitMoveParams {
  room_id: string;
  move_number: number;
  player_color: PlayerColor;
  from_square: string;
  to_square: string;
  piece: string;
  captured_piece?: string;
  is_castle?: boolean;
  is_en_passant?: boolean;
  promotion?: string;
  fen_after: string;
  time_taken?: number;
}

// Timer update params
export interface UpdateTimerParams {
  room_id: string;
  white_time_left: number;
  black_time_left: number;
}

// Game result params
export interface SubmitGameResultParams {
  room_id: string;
  winner_id: string | null;
  result: GameResult;
}

// Realtime event types
export type RealtimeEventType = 
  | 'ROOM_CREATED'
  | 'ROOM_JOINED'
  | 'ROOM_UPDATED'
  | 'MOVE_MADE'
  | 'TIMER_UPDATE'
  | 'GAME_FINISHED'
  | 'PLAYER_LEFT'
  | 'SPECTATOR_JOINED'
  | 'SPECTATOR_LEFT';

// Realtime event payload
export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

// Room list filter
export interface RoomFilter {
  status?: RoomStatus;
  time_control?: number;
  limit?: number;
}

// Player info
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  color: PlayerColor;
}

// Database/API Game State (without Chess instance)
// For data transfer and storage only
export interface MultiplayerGameData {
  room: GameRoom;
  players: {
    white: Player | null;
    black: Player | null;
  };
  moves: GameMove[];
  spectators: RoomSpectator[];
  currentTurn: PlayerColor;
  isMyTurn: boolean;
  myColor: PlayerColor | null;
  timeLeft: {
    white: number;
    black: number;
  };
  lastMove: GameMove | null;
}

// Timer state
export interface TimerState {
  whiteTime: number;
  blackTime: number;
  isRunning: boolean;
  currentTurn: PlayerColor;
  lastUpdate: number;
}

// Rating change
export interface RatingChange {
  oldRating: number;
  newRating: number;
  change: number;
}

// Game statistics
export interface GameStatistics {
  totalMoves: number;
  captures: number;
  checks: number;
  castles: number;
  enPassants: number;
  promotions: number;
  averageMoveTime: number;
  longestThinkTime: number;
}

// Match result detail
export interface MatchResult {
  winner: Player | null;
  loser: Player | null;
  result: GameResult;
  reason: string;
  ratingChanges: {
    winner?: RatingChange;
    loser?: RatingChange;
  };
  statistics: GameStatistics;
}

// Room settings
export interface RoomSettings {
  timeControl: number;
  allowSpectators: boolean;
  isPrivate: boolean;
  autoRematch: boolean;
}

// Chat message (for future)
export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system';
}

// Notification types
export type NotificationType = 
  | 'game_invite'
  | 'move_made'
  | 'game_finished'
  | 'rematch_request'
  | 'time_warning';

// Notification
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// WebSocket message types
export interface WSMessage {
  type: 'ping' | 'pong' | 'move' | 'timer' | 'chat' | 'leave';
  data?: any;
  timestamp: number;
}

// Error types
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: GameError;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: Pagination;
}