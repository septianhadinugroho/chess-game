import React, { useState, useEffect, useRef } from 'react';
import { MultiplayerGameManager, MultiplayerGameState } from '@/lib/multiplayer-game-logic';
import EnhancedChessBoard from '@/components/game/EnhancedChessBoard';
import { GameResultModal } from '@/components/game/GameResultModal';
import { Toast } from '@/components/ui/Toast';
import { translations, Language } from '@/lib/language';
import { getSquareNotation } from '@/utils/helpers';
import { Square } from 'chess.js';
import { IoArrowBack, IoTime, IoPause, IoPlay } from 'react-icons/io5';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface MultiplayerGameScreenProps {
  userId: string;
  userName: string;
  roomId: string;
  roomCode: string;
  language: Language;
  onBack: () => void;
  onGameComplete: (won: boolean) => void;
}

export default function MultiplayerGameScreen({
  userId,
  userName,
  roomId,
  roomCode,
  language,
  onBack,
  onGameComplete
}: MultiplayerGameScreenProps) {
  const t = translations[language];
  
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  const gameManager = useRef<MultiplayerGameManager | null>(null);
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      moveSound.current = new Audio('/move.mp3');
      winSound.current = new Audio('/win.mp3');
      loseSound.current = new Audio('/lose.mp3');
    }

    const manager = new MultiplayerGameManager(
      userId,
      userName,
      (state) => setGameState(state),
      (won, reason) => {
        setGameStatus(reason);
        playSound(won ? 'win' : 'lose');
        onGameComplete(won);
      },
      () => {
        setGameStatus(language === 'id' ? 'Lawan Meninggalkan Permainan - Kamu Menang!' : 'Opponent Left - You Win!');
        playSound('win');
        showToast(
          language === 'id' ? 'Lawan meninggalkan permainan' : 'Opponent left the game',
          'info'
        );
      }
    );

    gameManager.current = manager;
    manager.joinRoom(roomId, roomCode);

    return () => {
      manager.cleanup();
    };
  }, []);

  const playSound = (type: 'move' | 'win' | 'lose') => {
    try {
      if (type === 'move') moveSound.current?.play();
      if (type === 'win') winSound.current?.play();
      if (type === 'lose') loseSound.current?.play();
    } catch (e) {
      console.log("Audio play failed", e);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSquareClick = async (row: number, col: number) => {
    if (!gameManager.current || !gameState || gameState.isPaused || gameState.countdown > 0 || gameStatus) return;

    const square = getSquareNotation(row, col) as Square;
    const piece = gameState.game.board()[row][col];

    // Check if it's player's turn
    const isMyTurn = (gameState.game.turn() === 'w' && gameState.playerColor === 'white') ||
                     (gameState.game.turn() === 'b' && gameState.playerColor === 'black');
    
    if (!isMyTurn) return;

    if (selectedSquare) {
      const success = await gameManager.current.makeMove(selectedSquare, square);
      
      if (success) {
        playSound('move');
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Reselect if clicking own piece
        if (piece && piece.color === gameState.game.turn()) {
          setSelectedSquare(square);
          setValidMoves(gameState.game.moves({ square, verbose: true }));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      if (piece && piece.color === gameState.game.turn()) {
        setSelectedSquare(square);
        setValidMoves(gameState.game.moves({ square, verbose: true }));
      }
    }
  };

  const handleTogglePause = async () => {
    if (!gameManager.current || gameStatus) return;
    await gameManager.current.togglePause();
  };

  const handleLeaveGame = async () => {
    const confirmLeave = confirm(
      language === 'id'
        ? 'Keluar dari permainan? Kamu akan kalah otomatis.'
        : 'Leave the game? You will lose automatically.'
    );

    if (!confirmLeave) return;

    if (gameManager.current) {
      await gameManager.current.leaveGame();
    }
    onBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{language === 'id' ? 'Memuat permainan...' : 'Loading game...'}</p>
        </div>
      </div>
    );
  }

  const isMyTurn = (gameState.game.turn() === 'w' && gameState.playerColor === 'white') ||
                   (gameState.game.turn() === 'b' && gameState.playerColor === 'black');

  const opponentTime = gameState.playerColor === 'white' ? gameState.blackTime : gameState.whiteTime;
  const myTime = gameState.playerColor === 'white' ? gameState.whiteTime : gameState.blackTime;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Toast 
        message={toast.message} 
        show={toast.show} 
        type={toast.type}
        onHide={() => setToast({ ...toast, show: false })} 
      />
      
      <GameResultModal 
        status={gameStatus} 
        onReset={() => {}} 
        onHome={onBack} 
        language={language}
        hidePlayAgain={true}
      />

      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <button 
          onClick={handleLeaveGame}
          aria-label="Leave Game"
          className="p-2 hover:bg-gray-100 rounded-xl" 
        >
          <IoArrowBack size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="font-bold text-gray-800 text-sm">ONLINE MATCH</div>
          <div className="flex items-center gap-2 text-xs font-mono bg-gray-100 px-2 rounded">
            Room: {roomCode}
          </div>
        </div>

        <button 
          onClick={handleTogglePause}
          disabled={gameStatus !== ''}
          aria-label={gameState?.isPaused ? "Resume Game" : "Pause Game"}
          className={`p-2 rounded-xl border transition-all ${
            gameState.isPaused 
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {gameState.isPaused ? <IoPlay size={20} /> : <IoPause size={20} />}
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-lg mx-auto w-full justify-center">
        
        {/* Opponent Area */}
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 text-white flex items-center justify-center font-bold shadow-md">
              {gameState.opponentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm">{gameState.opponentName}</div>
              <div className="text-xs text-gray-500 font-medium">
                {!isMyTurn && !gameState.isPaused && gameState.countdown === 0 ? (
                  <span className="text-green-600 animate-pulse">{language === 'id' ? 'Berpikir...' : 'Thinking...'}</span>
                ) : (
                  language === 'id' ? 'Menunggu' : 'Waiting'
                )}
              </div>
            </div>
          </div>
          {/* Opponent Timer */}
          <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-sm transition-all border-2 ${
            !isMyTurn && gameState.timerActive && !gameState.isPaused && gameState.countdown === 0
              ? 'bg-white border-green-500 text-green-600 scale-105' 
              : 'bg-gray-200 border-transparent text-gray-500'
          }`}>
            {formatTime(opponentTime)}
          </div>
        </div>

        {/* Pause/Countdown Overlay */}
        <div className="relative">
          {gameState.countdown > 0 && (
            <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
              <div className="text-8xl font-black text-white drop-shadow-2xl animate-bounce-slow">
                {gameState.countdown}
              </div>
            </div>
          )}
          
          {gameState.isPaused && gameState.countdown === 0 && !gameStatus && (
            <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
              <div className="bg-white px-6 py-3 rounded-xl shadow-xl text-center">
                <IoTime className="text-yellow-500 text-3xl mx-auto mb-2" />
                <p className="font-bold text-gray-700 mb-1">
                  {language === 'id' ? 'PERMAINAN DI-PAUSE' : 'GAME PAUSED'}
                </p>
                {gameState.pausedBy && (
                  <p className="text-xs text-gray-500">
                    {language === 'id' ? 'oleh ' : 'by '}
                    {gameState.pausedBy === userId ? (language === 'id' ? 'kamu' : 'you') : gameState.opponentName}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <EnhancedChessBoard
            board={gameState.game.board()}
            orientation={gameState.playerColor || 'white'}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            lastMove={gameState.lastMove}
            showTimer={false} 
          />
        </div>

        {/* Player Area */}
        <div className="flex justify-between items-start mt-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm">{userName}</div>
              <div className="text-xs font-bold text-blue-600 capitalize">
                {gameState.playerColor}
              </div>
            </div>
          </div>
          {/* My Timer */}
          <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-sm transition-all border-2 ${
            isMyTurn && gameState.timerActive && !gameState.isPaused && gameState.countdown === 0
              ? 'bg-white border-blue-500 text-blue-600 scale-105' 
              : 'bg-gray-200 border-transparent text-gray-500'
          }`}>
            {formatTime(myTime)}
          </div>
        </div>

        {/* Turn Indicator */}
        {!gameStatus && gameState.countdown === 0 && (
          <div className="mt-4 text-center">
            <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm shadow-md ${
              isMyTurn
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {isMyTurn 
                ? (language === 'id' ? '🎯 Giliran Kamu!' : '🎯 Your Turn!') 
                : (language === 'id' ? '⏳ Giliran Lawan' : '⏳ Opponent\'s Turn')}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}