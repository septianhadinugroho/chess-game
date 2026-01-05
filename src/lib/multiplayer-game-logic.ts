import { Chess } from 'chess.js';
import { supabase } from '@/lib/supabase';

// Game state interface for multiplayer
export interface MultiplayerGameState {
  game: Chess;
  roomId: string;
  roomCode: string;
  playerColor: 'white' | 'black' | null;
  playerName: string;
  opponentName: string;
  whiteTime: number;
  blackTime: number;
  timerActive: boolean;
  isPaused: boolean;
  pausedBy: string | null;
  moveHistory: string[];
  lastMove: { from: string; to: string } | null;
  countdown: number;
}

export class MultiplayerGameManager {
  private state: MultiplayerGameState;
  private userId: string;
  private timerInterval: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private realtimeChannel: any = null;
  private isProcessingUpdate: boolean = false;
  private hasGameEnded: boolean = false; // Prevent duplicate notifications
  
  private onStateChange: (state: MultiplayerGameState) => void;
  private onGameEnd: (won: boolean, reason: string) => void;
  private onOpponentLeft: () => void;

  constructor(
    userId: string,
    playerName: string,
    onStateChange: (state: MultiplayerGameState) => void,
    onGameEnd: (won: boolean, reason: string) => void,
    onOpponentLeft: () => void
  ) {
    this.userId = userId;
    this.onStateChange = onStateChange;
    this.onGameEnd = onGameEnd;
    this.onOpponentLeft = onOpponentLeft;

    this.state = {
      game: new Chess(),
      roomId: '',
      roomCode: '',
      playerColor: null,
      playerName: playerName,
      opponentName: 'Opponent',
      whiteTime: 60,
      blackTime: 60,
      timerActive: false,
      isPaused: false,
      pausedBy: null,
      moveHistory: [],
      lastMove: null,
      countdown: 0,
    };
  }

  // Join room and setup game
  async joinRoom(roomId: string, roomCode: string) {
    try {
      // Fetch room data
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !room) {
        console.error('Room fetch error:', error);
        throw new Error('Room not found');
      }

      // Determine player color & names
      const isHost = this.userId === room.host_user_id;
      const playerColor = isHost ? room.host_color : (room.host_color === 'white' ? 'black' : 'white');
      
      // Fetch player names separately to avoid join issues
      let hostName = 'Host';
      let guestName = 'Guest';
      
      if (room.host_user_id) {
        const { data: hostData } = await supabase
          .from('user_progress')
          .select('player_name')
          .eq('user_id', room.host_user_id)
          .single();
        if (hostData) hostName = hostData.player_name || 'Host';
      }
      
      if (room.guest_user_id) {
        const { data: guestData } = await supabase
          .from('user_progress')
          .select('player_name')
          .eq('user_id', room.guest_user_id)
          .single();
        if (guestData) guestName = guestData.player_name || 'Guest';
      }
      
      const opponentName = isHost ? guestName : hostName;

      // Load game state
      const newGame = new Chess(room.current_fen);

      this.state = {
        ...this.state,
        game: newGame,
        roomId,
        roomCode,
        playerColor,
        opponentName,
        whiteTime: room.white_time_left,
        blackTime: room.black_time_left,
        moveHistory: newGame.history(),
        timerActive: room.status === 'playing' && !room.is_paused,
        isPaused: room.is_paused || false,
        pausedBy: null,
      };

      this.onStateChange(this.state);

      // Setup realtime listener
      this.setupRealtimeListener();

      // Start timer if game is active
      if (this.state.timerActive) {
        this.startTimer();
      }

    } catch (e) {
      console.error('Error joining room:', e);
      throw e;
    }
  }

  // Setup realtime listener
  private setupRealtimeListener() {
    this.realtimeChannel = supabase
      .channel(`room_${this.state.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${this.state.roomId}`
        },
        (payload) => this.handleRoomUpdate(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${this.state.roomId}`
        },
        () => {
          this.onOpponentLeft();
        }
      )
      .subscribe();
  }

  // Handle room updates from realtime
  private handleRoomUpdate(roomData: any) {
    // Prevent processing our own updates
    if (this.isProcessingUpdate) return;
    this.isProcessingUpdate = true;

    try {
      // Check if opponent left
      if (!roomData.guest_user_id && roomData.host_user_id !== this.userId) {
        this.onOpponentLeft();
        return;
      }

      // Update FEN if changed AND it's not our turn
      const isMyTurn = (this.state.game.turn() === 'w' && this.state.playerColor === 'white') ||
                       (this.state.game.turn() === 'b' && this.state.playerColor === 'black');
      
      if (roomData.current_fen && 
          roomData.current_fen !== this.state.game.fen() && 
          !isMyTurn) {
        
        const newGame = new Chess(roomData.current_fen);
        this.state.game = newGame;
        this.state.moveHistory = newGame.history();
        
        // Extract last move
        const history = newGame.history({ verbose: true });
        if (history.length > 0) {
          const lastMove = history[history.length - 1];
          this.state.lastMove = { from: lastMove.from, to: lastMove.to };
        }

        this.onStateChange(this.state);
        this.checkGameEnd();
      }

      // Update timers
      if (roomData.white_time_left !== undefined) {
        this.state.whiteTime = roomData.white_time_left;
      }
      if (roomData.black_time_left !== undefined) {
        this.state.blackTime = roomData.black_time_left;
      }

      // Update pause state
      if (roomData.is_paused !== this.state.isPaused) {
        this.handlePauseToggle(roomData.is_paused, roomData.paused_by);
      }

      // Check if game finished - BUT don't trigger if we already triggered it locally
      if (roomData.status === 'finished' && this.state.game.turn() !== this.state.game.turn()) {
        this.stopTimer();
        
        // Only show notification if we haven't processed it yet
        // (This prevents duplicate notifications)
        if (!this.hasGameEnded) {
          this.hasGameEnded = true;
          
          if (roomData.winner_id === this.userId) {
            const reason = roomData.result === 'timeout' 
              ? `⏱️ Lawan kehabisan waktu! Kamu Menang` 
              : `♔ Skakmat! Kamu Menang`;
            this.onGameEnd(true, reason);
          } else if (roomData.winner_id) {
            const reason = roomData.result === 'timeout' 
              ? `⏱️ Waktu kamu habis! Kamu Kalah` 
              : `♔ Skakmat! Kamu Kalah`;
            this.onGameEnd(false, reason);
          } else {
            this.onGameEnd(false, '🤝 Permainan Seri (Draw)');
          }
        }
      }

      this.onStateChange(this.state);
    } finally {
      // Reset flag after a small delay
      setTimeout(() => {
        this.isProcessingUpdate = false;
      }, 100);
    }
  }

  // Player makes move
  async makeMove(from: string, to: string, promotion = 'q'): Promise<boolean> {
    const { game, playerColor, roomId } = this.state;

    // Validate turn
    if ((game.turn() === 'w' && playerColor === 'black') ||
        (game.turn() === 'b' && playerColor === 'white')) {
      return false;
    }

    // Prevent double moves
    if (this.isProcessingUpdate) {
      return false;
    }

    // Validate & make move
    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;

      // Set flag to prevent race condition
      this.isProcessingUpdate = true;

      this.state.moveHistory = game.history();
      this.state.lastMove = { from, to };
      this.onStateChange(this.state);

      // Send move to database
      const moveInsert = {
        room_id: roomId,
        player_id: this.userId,
        player_color: playerColor,
        from_square: from,
        to_square: to,
        piece: move.piece,
        captured_piece: move.captured || null,
        is_castle: move.flags ? (move.flags.includes('k') || move.flags.includes('q')) : false,
        is_en_passant: move.flags ? move.flags.includes('e') : false,
        promotion: move.promotion || null,
        fen_after: game.fen(),
        san: move.san,
        move_number: game.history().length,
      };

      const { error: moveError } = await supabase.from('game_moves').insert(moveInsert);
      
      if (moveError) {
        console.error('Insert move error:', moveError);
      }

      // Update room state - Only update FEN and timestamp
      const updateData = {
        current_fen: game.fen(),
        last_move_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('game_rooms')
        .update(updateData)
        .eq('id', roomId)
        .eq('status', 'playing'); // Extra safety check

      if (updateError) {
        console.error('Update room error:', updateError);
      }

      // Check game end BEFORE resetting flag
      await this.checkGameEnd();

      // Reset flag after delay
      setTimeout(() => {
        this.isProcessingUpdate = false;
      }, 300);

      return true;
    } catch (e) {
      console.error('Move error:', e);
      this.isProcessingUpdate = false;
      return false;
    }
  }

  // Toggle pause
  async togglePause() {
    const newPauseState = !this.state.isPaused;

    if (newPauseState) {
      // Pause game
      await supabase
        .from('game_rooms')
        .update({
          is_paused: true,
          paused_by: this.userId,
          white_time_left: this.state.whiteTime,
          black_time_left: this.state.blackTime,
        })
        .eq('id', this.state.roomId);
    } else {
      // Resume with countdown
      this.startCountdown(() => {
        supabase
          .from('game_rooms')
          .update({
            is_paused: false,
            paused_by: null,
          })
          .eq('id', this.state.roomId);
      });
    }
  }

  // Handle pause toggle from realtime
  private handlePauseToggle(isPaused: boolean, pausedBy: string | null) {
    this.state.isPaused = isPaused;
    this.state.pausedBy = pausedBy;

    if (isPaused) {
      this.stopTimer();
    } else {
      // Resume with countdown
      this.startCountdown(() => {
        this.startTimer();
      });
    }

    this.onStateChange(this.state);
  }

  // Start countdown (3-2-1)
  private startCountdown(onComplete: () => void) {
    this.state.countdown = 3;
    this.onStateChange(this.state);

    this.countdownInterval = setInterval(() => {
      this.state.countdown--;
      
      if (this.state.countdown <= 0) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
        this.state.countdown = 0;
        onComplete();
      }
      
      this.onStateChange(this.state);
    }, 1000);
  }

  // Start timer
  private startTimer() {
    this.stopTimer();
    
    this.timerInterval = setInterval(() => {
      if (this.state.isPaused) return;

      const currentTurn = this.state.game.turn();
      
      // Decrement active player's time
      if (currentTurn === 'w') {
        this.state.whiteTime = Math.max(0, this.state.whiteTime - 1);
        
        if (this.state.whiteTime <= 0) {
          this.handleTimeout('white');
        }
      } else {
        this.state.blackTime = Math.max(0, this.state.blackTime - 1);
        
        if (this.state.blackTime <= 0) {
          this.handleTimeout('black');
        }
      }

      this.onStateChange(this.state);
    }, 1000);
  }

  // Stop timer
  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Handle timeout
  private async handleTimeout(timeoutColor: 'white' | 'black') {
    // Prevent multiple calls
    if (this.isProcessingUpdate) return;
    this.isProcessingUpdate = true;
    
    this.stopTimer();

    // Determine winner based on who ran out of time
    const isWhiteTimeout = timeoutColor === 'white';
    
    // If white timeout, black wins (and vice versa)
    let winnerId: string | null = null;
    let won = false;
    
    if (isWhiteTimeout) {
      // White ran out of time, black wins
      winnerId = this.state.playerColor === 'black' ? this.userId : null;
      won = this.state.playerColor === 'black';
    } else {
      // Black ran out of time, white wins
      winnerId = this.state.playerColor === 'white' ? this.userId : null;
      won = this.state.playerColor === 'white';
    }

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'finished',
          result: won ? 'win' : 'lose', // Use 'win' or 'lose' not 'timeout'
          winner_id: winnerId,
          pgn: this.state.game.pgn(),
        })
        .eq('id', this.state.roomId)
        .eq('status', 'playing');

      if (error) {
        console.error('Timeout update error:', error);
      }

      // Trigger game end immediately with dynamic message
      const opponentColor = this.state.playerColor === 'white' ? 'Black' : 'White';
      const myColor = this.state.playerColor === 'white' ? 'White' : 'Black';
      
      const reason = won 
        ? `⏱️ ${opponentColor} (${this.state.opponentName}) kehabisan waktu! ${myColor} Menang!` 
        : `⏱️ ${myColor} kehabisan waktu! ${opponentColor} (${this.state.opponentName}) Menang!`;
      
      this.onGameEnd(won, reason);
    } catch (error) {
      console.error('Handle timeout error:', error);
    } finally {
      setTimeout(() => {
        this.isProcessingUpdate = false;
      }, 500);
    }
  }

  // Check game end
  private async checkGameEnd() {
    const { game } = this.state;

    // Prevent multiple calls
    if (this.isProcessingUpdate) return;

    if (game.isCheckmate()) {
      this.isProcessingUpdate = true;
      this.stopTimer();
      
      // Determine winner
      // If it's white's turn and checkmate, white lost (black wins)
      const isWhiteTurn = game.turn() === 'w';
      
      let winnerId: string | null = null;
      let won = false;
      
      if (isWhiteTurn) {
        // White is checkmated, black wins
        winnerId = this.state.playerColor === 'black' ? this.userId : null;
        won = this.state.playerColor === 'black';
      } else {
        // Black is checkmated, white wins
        winnerId = this.state.playerColor === 'white' ? this.userId : null;
        won = this.state.playerColor === 'white';
      }

      try {
        const { error } = await supabase
          .from('game_rooms')
          .update({
            status: 'finished',
            result: won ? 'win' : 'lose',
            winner_id: winnerId,
            pgn: game.pgn(),
          })
          .eq('id', this.state.roomId)
          .eq('status', 'playing');

        if (error) {
          console.error('Checkmate update error:', error);
        }

        // Trigger game end immediately with dynamic message
        const opponentColor = this.state.playerColor === 'white' ? 'Black' : 'White';
        const myColor = this.state.playerColor === 'white' ? 'White' : 'Black';
        
        const reason = won 
          ? `♔ Skakmat! ${opponentColor} (${this.state.opponentName}) kalah. ${myColor} Menang!` 
          : `♔ Skakmat! ${myColor} kalah. ${opponentColor} (${this.state.opponentName}) Menang!`;
        
        this.onGameEnd(won, reason);
      } catch (error) {
        console.error('Check game end error:', error);
      } finally {
        setTimeout(() => {
          this.isProcessingUpdate = false;
        }, 500);
      }
    } else if (game.isDraw()) {
      this.isProcessingUpdate = true;
      this.stopTimer();
      
      try {
        const { error } = await supabase
          .from('game_rooms')
          .update({
            status: 'finished',
            result: 'draw',
            winner_id: null,
            pgn: game.pgn(),
          })
          .eq('id', this.state.roomId)
          .eq('status', 'playing');

        if (error) {
          console.error('Draw update error:', error);
        }

        // Trigger game end immediately
        this.onGameEnd(false, '🤝 Permainan Seri (Draw)');
      } catch (error) {
        console.error('Check game end error:', error);
      } finally {
        setTimeout(() => {
          this.isProcessingUpdate = false;
        }, 500);
      }
    }
  }

  // Leave game
  async leaveGame() {
    this.stopTimer();

    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
    }

    // Mark as abandoned
    await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        result: 'abandoned',
        winner_id: null,
      })
      .eq('id', this.state.roomId);
  }

  // Cleanup
  cleanup() {
    this.stopTimer();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
  }

  getState(): MultiplayerGameState {
    return this.state;
  }
}