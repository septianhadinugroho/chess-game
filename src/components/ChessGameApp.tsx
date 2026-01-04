'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { ChessEngine } from '@/lib/chess-engine';
import { AI_LEVELS } from '@/constants/game-config';
import { getSquareNotation } from '@/utils/helpers';
import { translations, Language } from '@/lib/language';
import { LoginCard } from '@/components/auth/LoginCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { Leaderboard } from '@/components/pages/Leaderboard';
import { StatsPage } from '@/components/pages/StatsPage';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { IoLogOut, IoArrowBack, IoRefresh, IoArrowUndo, IoSave, IoLogoInstagram, IoCheckmark, IoLanguage } from 'react-icons/io5';

const GameResultModal = ({ status, onReset, onHome, language }: any) => {
  if (!status) return null;
  const t = translations[language];
  const isWin = status.includes(t.youWin);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-pop-in">
        <div className="text-6xl mb-4">{isWin ? '🏆' : '😢'}</div>
        <h2 className={`text-3xl font-bold mb-2 ${isWin ? 'text-blue-400' : 'text-slate-400'}`}>
          {isWin ? t.victory : t.defeat}
        </h2>
        <p className="text-slate-300 mb-8 font-medium">{status}</p>
        
        <div className="space-y-3">
          <button onClick={onReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
            {t.playAgain}
          </button>
          <button onClick={onHome} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-3 rounded-xl font-bold transition-all active:scale-95">
            {t.backToMenu}
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, show, onHide }: { message: string; show: boolean; onHide: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
        <IoCheckmark size={20} />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default function ChessGameApp() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [showGame, setShowGame] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'stats' | 'settings'>('home');
  const [progress, setProgress] = useState<any>({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });
  const [language, setLanguage] = useState<Language>('id');
  
  const [toast, setToast] = useState({ show: false, message: '' });

  const engine = new ChessEngine();
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  const t = translations[language];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      moveSound.current = new Audio('/move.mp3');
      winSound.current = new Audio('/win.mp3');
      loseSound.current = new Audio('/lose.mp3');
      
      const savedLang = localStorage.getItem('chess_language');
      if (savedLang === 'en' || savedLang === 'id') {
        setLanguage(savedLang);
      }
    }

    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || 'Player');
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchProgress(session.user.id);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsLoggedIn(true);
      setUserName(session.user.user_metadata.full_name || 'Player');
      setUserEmail(session.user.email || '');
      setUserId(session.user.id);
      await fetchProgress(session.user.id);
    }
  };
  
  const fetchProgress = async (uid: string) => {
    try {
      const { data } = await supabase.from('user_progress').select('*').eq('user_id', uid).single();
      if (data) {
        setProgress({ 
          highestLevel: data.highest_level, 
          gamesWon: data.games_won, 
          gamesPlayed: data.games_played 
        });
      } else {
        await supabase.from('user_progress').insert([{ user_id: uid }]);
      }
    } catch (e) { 
      console.error("Error fetching progress", e); 
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'id' ? 'en' : 'id';
    setLanguage(newLang);
    localStorage.setItem('chess_language', newLang);
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  const playSound = (type: 'move' | 'win' | 'lose') => {
    try {
      if(type === 'move') moveSound.current?.play();
      if(type === 'win') winSound.current?.play();
      if(type === 'lose') loseSound.current?.play();
    } catch (e) { 
      console.log("Audio play failed", e); 
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
    setShowGame(false);
    setActiveTab('home');
  };

  const startGame = (color: 'white' | 'black' | 'random') => {
    const chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color;
    setPlayerColor(chosen);
    setShowGame(true);
    
    const saved = loadSavedGame();
    if (saved && saved.level === currentLevel && saved.color === chosen) {
      const newGame = new Chess(saved.fen);
      setGame(newGame);
      setBoard(newGame.board());
      showToast(t.gameLoaded);
    } else {
      resetGame();
    }
    
    if (chosen === 'black') {
      setTimeout(() => makeAIMove(new Chess()), 800);
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameStatus('');
    setIsThinking(false);
    
    if (userId) {
      localStorage.removeItem(`chess_save_${userId}_${currentLevel}`);
    }
  };

  const handleUndo = () => {
    const history = game.history();
    if (history.length < 2 || isThinking || gameStatus) {
      return;
    }
    
    game.undo();
    if (game.history().length > 0) {
      game.undo();
    }
    
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setBoard(newGame.board());
    setValidMoves([]);
    setSelectedSquare(null);
    
    showToast(t.moveCanceled);
  };
  
  const loadSavedGame = () => {
    if (!userId) return null;
    const saved = localStorage.getItem(`chess_save_${userId}_${currentLevel}`);
    return saved ? JSON.parse(saved) : null;
  };

  const handleSaveGame = () => {
    const history = game.history();
    if (!userId || gameStatus || history.length === 0) {
      return;
    }
    
    const saveData = {
      fen: game.fen(),
      level: currentLevel,
      color: playerColor,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`chess_save_${userId}_${currentLevel}`, JSON.stringify(saveData));
    showToast(t.gameSaved);
  };

  const saveGameResult = async (won: boolean) => {
    if(won) playSound('win');
    else playSound('lose');

    if (!userId) return;
    
    try {
      const newWon = won ? progress.gamesWon + 1 : progress.gamesWon;
      const newPlayed = progress.gamesPlayed + 1;
      const newLevel = won && currentLevel < 10 && currentLevel === progress.highestLevel 
                       ? progress.highestLevel + 1 
                       : progress.highestLevel;

      setProgress({ ...progress, gamesWon: newWon, gamesPlayed: newPlayed, highestLevel: newLevel });

      await supabase.from('user_progress').update({
        games_played: newPlayed,
        games_won: newWon,
        highest_level: newLevel
      }).eq('user_id', userId);

      await supabase.from('game_history').insert([{
        user_id: userId,
        level: currentLevel,
        player_color: playerColor,
        result: won ? 'win' : 'lose',
        moves_count: game.history().length,
        pgn: game.pgn()
      }]);
      
      localStorage.removeItem(`chess_save_${userId}_${currentLevel}`);
    } catch (e) { 
      console.error(e);
    }
  };

  const makeAIMove = (currentGame: Chess) => {
    if(currentGame.isGameOver()) return;
    
    setIsThinking(true);
    setTimeout(() => {
      const aiConfig = AI_LEVELS[currentLevel - 1];
      const bestMove = engine.getBestMove(currentGame, aiConfig.depth, playerColor === 'black');
      
      if (bestMove) {
        currentGame.move(bestMove);
        playSound('move');
        
        const newGame = new Chess(currentGame.fen());
        setGame(newGame);
        setBoard(newGame.board());
        checkGameStatus(newGame);
      }
      setIsThinking(false);
    }, 500);
  };

  const checkGameStatus = (chess: Chess) => {
    if (chess.isCheckmate()) {
      const playerWon = (chess.turn() === 'b' && playerColor === 'white') || 
                       (chess.turn() === 'w' && playerColor === 'black');
      setGameStatus(playerWon ? `🎉 ${t.youWin}` : `💀 ${t.youLose}`);
      saveGameResult(playerWon);
    } else if (chess.isDraw()) {
      setGameStatus(`🤝 ${t.draw}`);
      saveGameResult(false);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isThinking || gameStatus) return;
    
    if ((game.turn() === 'w' && playerColor === 'black') || 
        (game.turn() === 'b' && playerColor === 'white')) return;

    const square = getSquareNotation(row, col) as Square;
    const piece = board[row][col];

    if (selectedSquare) {
      try {
        const move = { from: selectedSquare as Square, to: square, promotion: 'q' };
        const valid = game.moves({ verbose: true }).find(m => m.from === selectedSquare && m.to === square);
        
        if (valid) {
          game.move(move);
          playSound('move');
          
          const newGame = new Chess(game.fen());
          setGame(newGame);
          setBoard(newGame.board());
          setSelectedSquare(null);
          setValidMoves([]);
          
          checkGameStatus(newGame);
          if (!newGame.isGameOver()) makeAIMove(newGame);
        } else {
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            setValidMoves(game.moves({ square, verbose: true }));
          } else {
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      } catch (e) { 
        setSelectedSquare(null); 
        setValidMoves([]); 
      }
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }));
      }
    }
  };

  if (!isLoggedIn) return <LoginCard onLogin={handleLogin} language={language} onLanguageToggle={toggleLanguage} />;

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen pb-20 bg-slate-900">
        <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
        
        <div className="bg-linear-to-br from-blue-900 to-blue-950 p-8 rounded-b-3xl shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{t.settings}</h1>
          <p className="text-blue-200 text-sm">{t.manageAccount}</p>
        </div>

        <div className="px-4 space-y-4 animate-slide-up">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-100 mb-4 text-lg border-b border-slate-700 pb-2">{t.googleAccount}</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-xl text-blue-400 border border-blue-600/30">
                👤
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-slate-100 truncate">{userName}</div>
                <div className="text-sm text-slate-400 truncate">{userEmail}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-3 border-2 border-red-600/30 bg-red-600/10 text-red-400 rounded-xl font-bold hover:bg-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
              <IoLogOut size={20} /> {t.logout}
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-100 mb-4 text-lg border-b border-slate-700 pb-2">Language / Bahasa</h3>
            <button
              onClick={toggleLanguage}
              className="w-full py-3 bg-blue-600/20 border-2 border-blue-600/30 text-blue-400 rounded-xl font-bold hover:bg-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <IoLanguage size={20} />
              {language === 'id' ? '🇬🇧 Switch to English' : '🇮🇩 Ganti ke Indonesia'}
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm text-center">
            <h3 className="font-bold text-slate-100 mb-2">{t.aboutApp}</h3>
            <p className="text-slate-400 mb-4 text-sm">{t.appVersion}</p>
            <div className="border-t border-slate-700 pt-4 mt-2">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest">{t.builtBy}</p>
              <p className="font-bold text-blue-400 text-lg mb-3">Septian Hadi Nugroho</p>
              <a 
                href="https://instagram.com/septianhnr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pink-400 font-semibold hover:text-pink-300 bg-pink-600/10 border border-pink-600/30 px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              >
                <IoLogoInstagram size={18} />
                @septianhnr
              </a>
            </div>
          </div>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  if (showGame) {
    const history = game.history();
    const canUndo = history.length >= 2 && !isThinking && !gameStatus;
    const canSave = history.length > 0 && !gameStatus;
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
        <GameResultModal status={gameStatus} onReset={resetGame} onHome={() => { setShowGame(false); resetGame(); }} language={language} />

        <div className="bg-slate-800 border-b border-slate-700 shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <button 
            onClick={() => { setShowGame(false); resetGame(); }} 
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 transition-colors active:scale-95"
            aria-label="Back to menu"
          >
            <IoArrowBack size={24} />
          </button>
          <div className="font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow"></span>
            {t.level} {currentLevel}
          </div>
          <button 
            onClick={resetGame} 
            className="p-2 rounded-full hover:bg-red-600/20 text-red-400 flex items-center gap-1 bg-red-600/10 px-3 border border-red-600/30 transition-colors active:scale-95"
            aria-label="Reset game"
          >
            <IoRefresh size={18} /> <span className="text-xs font-bold">{t.reset}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col w-full max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 text-white flex items-center justify-center text-lg shadow-md">
                🤖
              </div>
              <div>
                <div className="font-bold text-slate-100 leading-tight">AI Computer</div>
                <div className="text-xs text-slate-400 font-medium h-4">
                  {isThinking ? <span className="text-blue-400 animate-pulse-slow">{t.aiThinking}</span> : t.waitingTurn}
                </div>
              </div>
            </div>
          </div>

          <ChessBoard
            board={board}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
          />

          <div className="mt-4 mb-2 min-h-14 flex items-center justify-center">
            {game.isCheck() && !gameStatus ? (
              <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold animate-pulse-slow shadow-lg flex items-center gap-2 text-sm">
                ⚠️ {t.check}
              </div>
            ) : !gameStatus ? (
              <div className={`px-6 py-2 rounded-full font-bold border transition-all shadow-sm text-sm ${
                  (game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black')
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                  {(game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black')
                  ? t.yourTurn
                  : t.waitingAI}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
            <button 
              onClick={handleUndo} 
              disabled={!canUndo}
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl shadow-sm border-b-4 transition-all ${
                canUndo
                  ? 'bg-slate-700 border-blue-600 text-blue-400 hover:bg-slate-600 active:border-b-0 active:translate-y-1'
                  : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Undo move"
            >
              <IoArrowUndo size={24} />
              <span className="text-xs font-bold">{t.undo}</span>
            </button>
            
            <button 
              onClick={handleSaveGame} 
              disabled={!canSave}
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl shadow-sm border-b-4 transition-all ${
                canSave
                  ? 'bg-slate-700 border-green-600 text-green-400 hover:bg-slate-600 active:border-b-0 active:translate-y-1'
                  : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Save game"
            >
              <IoSave size={24} />
              <span className="text-xs font-bold">{t.save}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if(activeTab === 'leaderboard') return (
    <div className="min-h-screen bg-slate-900">
      <Leaderboard currentUserId={userId || ''} language={language} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  );
  
  if(activeTab === 'stats') return (
    <div className="min-h-screen bg-slate-900">
      <StatsPage userId={userId || ''} progress={progress} language={language} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-slate-900">
      <Toast message={toast.message} show={toast.show} onHide={() => setToast({ ...toast, show: false })} />
      
      <div className="bg-linear-to-br from-blue-900 to-blue-950 p-6 md:p-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full bg-blue-800/30 border border-blue-600/30 text-blue-300 hover:bg-blue-800/50 transition-all active:scale-95"
            aria-label="Change language"
          >
            <IoLanguage size={20} />
          </button>
        </div>
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t.greeting}, {userName.split(' ')[0]} 👋</h1>
          <p className="text-blue-200 text-sm mb-6">{t.readyMessage}</p>
          
          <div className="flex items-center justify-center gap-0 bg-blue-800/30 backdrop-blur-md rounded-2xl border border-blue-600/30 overflow-hidden max-w-xs mx-auto">
            <div className="flex-1 text-center py-3 border-r border-blue-600/30">
              <div className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold">{t.level}</div>
              <div className="text-2xl font-bold text-white leading-none mt-1">{progress.highestLevel}</div>
            </div>
            <div className="flex-1 text-center py-3">
              <div className="text-[10px] text-blue-300 uppercase tracking-wider font-semibold">{t.wins}</div>
              <div className="text-2xl font-bold text-white leading-none mt-1">{progress.gamesWon}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-4 animate-slide-up">
        <LevelSelector
          currentLevel={currentLevel}
          highestLevel={progress.highestLevel}
          onSelectLevel={setCurrentLevel}
          language={language}
        />
        
        <div id="color-selector-section">
          <ColorSelector onSelectColor={startGame} language={language} />
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  );
}