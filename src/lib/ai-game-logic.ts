import { Chess } from 'chess.js';
import { ChessEngine } from '@/lib/chess-engine';
import { supabase } from '@/lib/supabase';

export interface AIGameState {
  game: Chess;
  playerColor: 'white' | 'black';
  currentLevel: number;
  isThinking: boolean;
  moveHistory: string[];
  lastMove: { from: string; to: string } | null;
}

export class AIGameManager {
  private engine: ChessEngine;
  private state: AIGameState;
  private userId: string | null;
  private onStateChange: (state: AIGameState) => void;
  private onGameEnd: (won: boolean, reason: string) => void;

  constructor(
    userId: string | null,
    onStateChange: (state: AIGameState) => void,
    onGameEnd: (won: boolean, reason: string) => void
  ) {
    this.engine = new ChessEngine();
    this.userId = userId;
    this.onStateChange = onStateChange;
    this.onGameEnd = onGameEnd;
    
    this.state = {
      game: new Chess(),
      playerColor: 'white',
      currentLevel: 1,
      isThinking: false,
      moveHistory: [],
      lastMove: null,
    };
  }

  // Initialize new game
  async initGame(color: 'white' | 'black' | 'random', level: number) {
    const finalColor = color === 'random' 
      ? (Math.random() > 0.5 ? 'white' : 'black') 
      : color;

    // Try load saved game
    let savedData = null;
    if (this.userId) {
      const { data } = await supabase
        .from('saved_games')
        .select('*')
        .eq('user_id', this.userId)
        .eq('level', level)
        .single();
      savedData = data;
    }

    const newGame = new Chess();
    let loadedHistory: string[] = [];

    if (savedData) {
      try {
        if (savedData.pgn) {
          newGame.loadPgn(savedData.pgn);
          loadedHistory = newGame.history();
        } else if (savedData.fen) {
          newGame.load(savedData.fen);
        }
      } catch (e) {
        console.error("Error loading saved game:", e);
      }
    }

    this.state = {
      game: newGame,
      playerColor: finalColor,
      currentLevel: level,
      isThinking: false,
      moveHistory: loadedHistory,
      lastMove: null,
    };

    this.onStateChange(this.state);

    // If AI starts, make first move
    const currentTurn = newGame.turn();
    const shouldAIStart = (currentTurn === 'w' && finalColor === 'black') || 
                          (currentTurn === 'b' && finalColor === 'white');
    
    if (shouldAIStart && !newGame.isGameOver()) {
      setTimeout(() => this.makeAIMove(), 800);
    }
  }

  // Reset game
  async resetGame(deleteFromDB = false) {
    const newGame = new Chess();
    
    this.state = {
      ...this.state,
      game: newGame,
      moveHistory: [],
      lastMove: null,
      isThinking: false,
    };

    this.onStateChange(this.state);

    if (this.userId && deleteFromDB) {
      await supabase
        .from('saved_games')
        .delete()
        .eq('user_id', this.userId)
        .eq('level', this.state.currentLevel);
    }
  }

  // Player makes move
  makePlayerMove(from: string, to: string, promotion = 'q'): boolean {
    if (this.state.isThinking) return false;

    const { game, playerColor } = this.state;
    
    // Check if it's player's turn
    if ((game.turn() === 'w' && playerColor === 'black') || 
        (game.turn() === 'b' && playerColor === 'white')) {
      return false;
    }

    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;

      // Update history & last move
      const newHistory = game.history();
      this.state.moveHistory = newHistory;
      this.state.lastMove = { from, to };
      
      this.onStateChange(this.state);

      // Check game end
      if (this.checkGameEnd()) {
        return true;
      }

      // AI's turn
      setTimeout(() => this.makeAIMove(), 500);
      return true;
    } catch (e) {
      return false;
    }
  }

  // AI makes move
  private makeAIMove() {
    if (this.state.game.isGameOver()) return;

    this.state.isThinking = true;
    this.onStateChange(this.state);

    setTimeout(() => {
      const { game, currentLevel, playerColor } = this.state;
      
      // Get AI difficulty
      const aiDepth = Math.min(Math.max(1, currentLevel), 5);
      const isAIWhite = playerColor === 'black';
      
      const bestMove = this.engine.getBestMove(game, aiDepth, isAIWhite);
      
      if (bestMove) {
        game.move(bestMove);
        
        this.state.moveHistory = game.history();
        this.state.lastMove = { from: bestMove.from, to: bestMove.to };
        this.state.isThinking = false;
        
        this.onStateChange(this.state);
        this.checkGameEnd();
      }
    }, 500);
  }

  // Undo last 2 moves (player + AI)
  undoMove(): boolean {
    const { game, moveHistory } = this.state;
    
    if (moveHistory.length < 1 || this.state.isThinking) {
      return false;
    }

    // Undo player move
    if (game.history().length > 0) {
      game.undo();
    }

    // Undo AI move if exists
    if (game.history().length > 0) {
      game.undo();
    }

    this.state.moveHistory = game.history();
    this.state.lastMove = null;
    
    this.onStateChange(this.state);
    return true;
  }

  // Save game to DB
  async saveGame() {
    if (!this.userId) return false;
    
    const { game, currentLevel, playerColor } = this.state;
    
    if (game.history().length === 0) return false;

    try {
      const { error } = await supabase
        .from('saved_games')
        .upsert({
          user_id: this.userId,
          fen: game.fen(),
          pgn: game.pgn(),
          level: currentLevel,
          player_color: playerColor,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (e) {
      console.error('Save error:', e);
      return false;
    }
  }

  // Check if game ended
  private checkGameEnd(): boolean {
    const { game, playerColor } = this.state;

    if (game.isCheckmate()) {
      const playerWon = (game.turn() === 'b' && playerColor === 'white') || 
                        (game.turn() === 'w' && playerColor === 'black');
      
      const reason = playerWon ? 'Skakmat! Kamu Menang' : 'Skakmat! Kamu Kalah';
      this.onGameEnd(playerWon, reason);
      return true;
    }

    if (game.isDraw()) {
      this.onGameEnd(false, 'Permainan Seri (Draw)');
      return true;
    }

    return false;
  }

  // Get current state
  getState(): AIGameState {
    return this.state;
  }
}