import { Chess } from 'chess.js';
import { ELO, PIECE_VALUES } from '@/constants/multiplayer-config';

/**
 * Generate random room code
 */
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Calculate new ELO ratings after a game
 */
export const calculateNewRatings = (
  winnerRating: number,
  loserRating: number
): { winnerNew: number; loserNew: number } => {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  const winnerNew = Math.round(winnerRating + ELO.K_FACTOR * (1 - expectedWinner));
  const loserNew = Math.round(loserRating + ELO.K_FACTOR * (0 - expectedLoser));

  return {
    winnerNew: Math.max(ELO.MIN_RATING, Math.min(ELO.MAX_RATING, winnerNew)),
    loserNew: Math.max(ELO.MIN_RATING, Math.min(ELO.MAX_RATING, loserNew))
  };
};

/**
 * Calculate rating change for a draw
 */
export const calculateDrawRatings = (
  player1Rating: number,
  player2Rating: number
): { player1New: number; player2New: number } => {
  const expected1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
  const expected2 = 1 - expected1;

  const player1New = Math.round(player1Rating + ELO.K_FACTOR * (0.5 - expected1));
  const player2New = Math.round(player2Rating + ELO.K_FACTOR * (0.5 - expected2));

  return {
    player1New: Math.max(ELO.MIN_RATING, Math.min(ELO.MAX_RATING, player1New)),
    player2New: Math.max(ELO.MIN_RATING, Math.min(ELO.MAX_RATING, player2New))
  };
};

/**
 * Format time in MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time in human readable format
 */
export const formatTimeHuman = (seconds: number, language: 'id' | 'en' = 'id'): string => {
  const mins = Math.floor(seconds / 60);
  if (language === 'id') {
    return `${mins} menit`;
  }
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
};

/**
 * Get game result text
 */
export const getResultText = (
  result: string,
  playerColor: 'white' | 'black',
  language: 'id' | 'en' = 'id'
): string => {
  if (result === 'draw') {
    return language === 'id' ? 'Remis' : 'Draw';
  }
  
  const isWinner = (result === 'white' && playerColor === 'white') ||
                   (result === 'black' && playerColor === 'black');
  
  if (language === 'id') {
    return isWinner ? 'Menang' : 'Kalah';
  }
  return isWinner ? 'Win' : 'Loss';
};

/**
 * Validate room code format
 */
export const isValidRoomCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code);
};

/**
 * Get share URL for room
 */
export const getShareURL = (roomCode: string): string => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}?room=${roomCode}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err2) {
      return false;
    }
  }
};

/**
 * Detect special move type
 */
export const getMoveType = (move: any): string => {
  if (!move.flags) return 'normal';
  
  if (move.flags.includes('k') || move.flags.includes('q')) {
    return 'castle';
  }
  if (move.flags.includes('e')) {
    return 'en-passant';
  }
  if (move.flags.includes('p')) {
    return 'promotion';
  }
  if (move.flags.includes('c')) {
    return 'capture';
  }
  
  return 'normal';
};

/**
 * Get move emoji
 */
export const getMoveEmoji = (moveType: string): string => {
  const emojis: Record<string, string> = {
    'castle': '🏰',
    'en-passant': '👻',
    'promotion': '👑',
    'capture': '⚔️',
    'check': '⚠️',
    'checkmate': '💀',
    'normal': ''
  };
  return emojis[moveType] || '';
};

/**
 * Evaluate board position (simple evaluation)
 */
export const evaluatePosition = (chess: Chess): number => {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -999999 : 999999;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }

  return score;
};

/**
 * Check if move is legal
 */
export const isLegalMove = (
  chess: Chess,
  from: string,
  to: string
): boolean => {
  try {
    const moves = chess.moves({ verbose: true });
    return moves.some(m => m.from === from && m.to === to);
  } catch {
    return false;
  }
};

/**
 * Get game phase (opening/middlegame/endgame)
 */
export const getGamePhase = (moveCount: number): string => {
  if (moveCount < 10) return 'opening';
  if (moveCount < 40) return 'middlegame';
  return 'endgame';
};

/**
 * Calculate material count
 */
export const getMaterialCount = (chess: Chess): { white: number; black: number } => {
  const board = chess.board();
  let white = 0;
  let black = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type !== 'k') {
        const value = PIECE_VALUES[piece.type as keyof typeof PIECE_VALUES] || 0;
        if (piece.color === 'w') {
          white += value;
        } else {
          black += value;
        }
      }
    }
  }

  return { white, black };
};

/**
 * Format move to algebraic notation with emoji
 */
export const formatMoveWithEmoji = (move: any, language: 'id' | 'en' = 'id'): string => {
  const moveType = getMoveType(move);
  const emoji = getMoveEmoji(moveType);
  
  // Standard algebraic notation
  const san = move.san || `${move.from}-${move.to}`;
  
  return emoji ? `${emoji} ${san}` : san;
};

/**
 * Generate share text for social media
 */
export const generateShareText = (
  roomCode: string,
  language: 'id' | 'en' = 'id'
): string => {
  const url = getShareURL(roomCode);
  
  if (language === 'id') {
    return `Ayo main catur online! 🎮♟️\n\nJoin room saya dengan kode: ${roomCode}\nAtau klik link: ${url}\n\n#ChessMaster #MainCatur`;
  }
  
  return `Let's play chess online! 🎮♟️\n\nJoin my room with code: ${roomCode}\nOr click: ${url}\n\n#ChessMaster #OnlineChess`;
};