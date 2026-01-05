// Time controls dalam seconds
export const TIME_CONTROLS = {
  BLITZ_5: 300,    // 5 minutes
  RAPID_10: 600,   // 10 minutes
  RAPID_15: 900,   // 15 minutes
  CLASSICAL_30: 1800, // 30 minutes
} as const;

// Room status
export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const;

// Game results
export const GAME_RESULTS = {
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
  ABANDONED: 'abandoned',
  TIMEOUT: 'timeout',
} as const;

// Player colors
export const PLAYER_COLORS = {
  WHITE: 'white',
  BLACK: 'black',
} as const;

// Chess piece values for evaluation
export const PIECE_VALUES = {
  p: 100,  // Pawn
  n: 320,  // Knight
  b: 330,  // Bishop
  r: 500,  // Rook
  q: 900,  // Queen
  k: 20000 // King
} as const;

// Position bonuses (simplified)
export const POSITION_BONUS = {
  // Pawn position bonus
  p: [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
  ],
  // Knight position bonus
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  // Add more if needed
} as const;

// ELO rating constants
export const ELO = {
  K_FACTOR: 32,
  DEFAULT_RATING: 1200,
  MIN_RATING: 0,
  MAX_RATING: 3000,
} as const;

// Realtime channels
export const REALTIME_CHANNELS = {
  ROOM: 'room:',
  MOVES: 'moves:',
  SPECTATORS: 'spectators:',
} as const;

// Timer update interval (ms)
export const TIMER_UPDATE_INTERVAL = 100;

// Room code length
export const ROOM_CODE_LENGTH = 6;

// Max spectators per room
export const MAX_SPECTATORS = 50;

// Room expiry time (hours)
export const ROOM_EXPIRY_HOURS = 1;

// Special move flags (from chess.js)
export const MOVE_FLAGS = {
  NORMAL: 'n',
  CAPTURE: 'c',
  BIG_PAWN: 'b',
  EP_CAPTURE: 'e',
  PROMOTION: 'p',
  KSIDE_CASTLE: 'k',
  QSIDE_CASTLE: 'q',
} as const;

// WebSocket reconnection config
export const WS_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY: 2000, // ms
  HEARTBEAT_INTERVAL: 30000, // ms
} as const;

export const MULTIPLAYER_CONFIG = {
  IS_MAINTENANCE: true,
  MIN_VERSION: '1.0.0',
  MAINTENANCE_MESSAGE: {
    id: "Fitur Multiplayer sedang dalam pengembangan. Main lawan AI dulu yuk!",
    en: "Multiplayer is under development. Try playing against AI for now!"
  }
};