export type PlayerColor = 'white' | 'black';

export type GameStatus = 
  | 'playing' 
  | 'check' 
  | 'checkmate_player' 
  | 'checkmate_ai' 
  | 'draw';

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export interface UserProgress {
  userId: string;
  currentLevel: number;
  highestLevel: number;
  gamesWon: number;
  gamesPlayed: number;
}