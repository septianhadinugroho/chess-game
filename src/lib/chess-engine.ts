import { Chess } from 'chess.js';
import { PIECE_VALUES } from '@/constants/game-config';

export class ChessEngine {
  evaluateBoard(chess: Chess): number {
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
  }

  minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluateBoard(chess);
    }

    const moves = chess.moves({ verbose: true });
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  getBestMove(chess: Chess, depth: number, isWhite: boolean) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = isWhite ? -Infinity : Infinity;

    for (const move of moves) {
      chess.move(move);
      const value = this.minimax(chess, depth, -Infinity, Infinity, !isWhite);
      chess.undo();

      if (isWhite) {
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      } else {
        if (value < bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }
}