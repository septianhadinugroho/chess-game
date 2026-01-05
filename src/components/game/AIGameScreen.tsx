import React, { useState, useEffect, useRef } from 'react';
import { AIGameManager, AIGameState } from '@/lib/ai-game-logic';
import EnhancedChessBoard from '@/components/game/EnhancedChessBoard';
import MoveHistory from '@/components/game/MoveHistory';
import { GameResultModal } from '@/components/game/GameResultModal';
import { Toast } from '@/components/ui/Toast';
import { translations, Language } from '@/lib/language';
import { getSquareNotation } from '@/utils/helpers';
import { Square } from 'chess.js';
import { 
  IoArrowBack, IoRefresh, IoArrowUndo, IoSave, IoList,
  IoRocket, IoShieldCheckmark
} from 'react-icons/io5';
import { GiRobotGolem } from 'react-icons/gi';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface AIGameScreenProps {
  userId: string | null;
  userName: string;
  level: number;
  color: 'white' | 'black' | 'random';
  language: Language;
  onBack: () => void;
  onGameComplete: (won: boolean) => void;
}

export default function AIGameScreen({
  userId,
  userName,
  level,
  color,
  language,
  onBack,
  onGameComplete
}: AIGameScreenProps) {
  const t = translations[language];
  
  const [gameState, setGameState] = useState<AIGameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState('');
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  const gameManager = useRef<AIGameManager | null>(null);
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      moveSound.current = new Audio('/move.mp3');
      winSound.current = new Audio('/win.mp3');
      loseSound.current = new Audio('/lose.mp3');
    }

    const manager = new AIGameManager(
      userId,
      (state) => setGameState(state),
      (won, reason) => {
        setGameStatus(reason);
        playSound(won ? 'win' : 'lose');
        onGameComplete(won);
      }
    );

    gameManager.current = manager;
    manager.initGame(color, level);

    return () => {
      // Cleanup if needed
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

  const handleSquareClick = (row: number, col: number) => {
    if (!gameManager.current || !gameState || gameState.isThinking || gameStatus) return;

    const square = getSquareNotation(row, col) as Square;
    const piece = gameState.game.board()[row][col];

    if (selectedSquare) {
      const success = gameManager.current.makePlayerMove(selectedSquare, square);
      
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

  const handleUndo = () => {
    if (!gameManager.current) return;
    
    const success = gameManager.current.undoMove();
    if (success) {
      setValidMoves([]);
      setSelectedSquare(null);
      showToast(t.moveCanceled, 'info');
    }
  };

  const handleSave = async () => {
    if (!gameManager.current || !gameState || gameStatus || gameState.moveHistory.length === 0) {
      return;
    }

    const success = await gameManager.current.saveGame();
    if (success) {
      showToast(t.gameSaved, 'success');
    } else {
      showToast('Gagal menyimpan', 'error');
    }
  };

  const handleReset = async () => {
    if (!gameManager.current) return;
    
    await gameManager.current.resetGame(true);
    setGameStatus('');
    setSelectedSquare(null);
    setValidMoves([]);
    showToast('Game di-reset', 'info');
  };

  const handlePlayAgain = async () => {
    if (!gameManager.current) return;
    
    await gameManager.current.resetGame(false);
    await gameManager.current.initGame(color, level);
    setGameStatus('');
    setSelectedSquare(null);
    setValidMoves([]);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const canUndo = gameState.moveHistory.length >= 1 && !gameState.isThinking && !gameStatus;
  const canSave = gameState.moveHistory.length > 0 && !gameStatus && !gameState.isThinking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col">
      <Toast 
        message={toast.message} 
        show={toast.show} 
        type={toast.type}
        onHide={() => setToast({ ...toast, show: false })} 
      />
      
      <GameResultModal 
        status={gameStatus} 
        onReset={handlePlayAgain} 
        onHome={onBack} 
        language={language} 
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <button 
          onClick={onBack} 
          aria-label="Back to menu"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors touch-feedback"
        >
          <IoArrowBack size={24} />
        </button>
        <div className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow"></span>
          {t.level} {level}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowMoveHistory(!showMoveHistory)}
            aria-label="Toggle History"
            className={`p-2 rounded-xl flex items-center gap-1 px-3 border transition-colors touch-feedback ${
              showMoveHistory
                ? 'bg-blue-500 text-white border-blue-500'
                : 'hover:bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            <IoList size={18} />
          </button>
          <button 
            onClick={handleReset}
            className="p-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-1 bg-red-50/50 px-3 border border-red-200 transition-colors touch-feedback"
          >
            <IoRefresh size={18} /> <span className="text-xs font-bold">{t.reset}</span>
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-2xl mx-auto w-full">
        {/* AI Player Info */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-white flex items-center justify-center shadow-lg">
              <GiRobotGolem className="text-2xl" />
            </div>
            <div>
              <div className="font-bold text-gray-800 leading-tight">{t.aiPlayer}</div>
              <div className="text-xs text-gray-500 font-medium h-4">
                {gameState.isThinking ? (
                  <span className="text-blue-600 animate-pulse-slow">{t.aiThinking}</span>
                ) : (
                  t.waitingTurn
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Move History Sidebar */}
        {showMoveHistory && (
          <div className="mb-4">
            <MoveHistory moves={gameState.moveHistory} language={language} compact />
          </div>
        )}

        {/* Chess Board */}
        <EnhancedChessBoard
          board={gameState.game.board()}
          orientation={gameState.playerColor}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
          lastMove={gameState.lastMove}
          showTimer={false}
        />

        {/* Game Status */}
        <div className="mt-4 mb-2 min-h-14 flex items-center justify-center">
          {gameState.game.isCheck() && !gameStatus ? (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold animate-pulse-slow shadow-lg flex items-center gap-2 text-sm">
              <IoShieldCheckmark size={18} />
              {t.check}
            </div>
          ) : !gameStatus ? (
            <div className={`px-6 py-2 rounded-full font-bold border-2 transition-all shadow-sm text-sm flex items-center gap-2 ${
                (gameState.game.turn() === 'w' && gameState.playerColor === 'white') || 
                (gameState.game.turn() === 'b' && gameState.playerColor === 'black')
                ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-400 shadow-blue-200'
                : 'bg-white text-gray-600 border-gray-200'
            }`}>
                {(gameState.game.turn() === 'w' && gameState.playerColor === 'white') || 
                 (gameState.game.turn() === 'b' && gameState.playerColor === 'black') ? (
                  <>
                    <IoRocket size={16} />
                    {t.yourTurn}
                  </>
                ) : (
                  <>
                    <GiRobotGolem size={16} />
                    {t.waitingAI}
                  </>
                )}
            </div>
          ) : null}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-feedback ${
              canUndo
                ? 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
                : 'bg-gray-100 text-gray-400 border-2 border-transparent cursor-not-allowed'
            }`}
          >
            <IoArrowUndo size={20} />
            {t.undo}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-feedback ${
              canSave
                ? 'bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-200 shadow-sm'
                : 'bg-gray-100 text-gray-400 border-2 border-transparent cursor-not-allowed'
            }`}
          >
            <IoSave size={20} />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}