'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { ChessEngine } from '@/lib/chess-engine';
import { AI_LEVELS } from '@/constants/game-config';
import { getSquareNotation } from '@/utils/helpers';
import { LoginCard } from '@/components/auth/LoginCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { Leaderboard } from '@/components/pages/Leaderboard';
import { StatsPage } from '@/components/pages/StatsPage';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { IoLogOut, IoArrowBack, IoRefresh, IoArrowUndo, IoPause, IoSave, IoLogoInstagram } from 'react-icons/io5';

// --- Components Kecil Internal ---

// Modal Hasil Game
const GameResultModal = ({ status, onReset, onHome }: any) => {
  if (!status) return null;
  const isWin = status.includes('Menang');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl animate-pop-in transform transition-all">
        <div className="text-6xl mb-4">{isWin ? '🏆' : '💀'}</div>
        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isWin ? 'text-green-600' : 'text-red-600'}`}>
          {isWin ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-gray-600 mb-8 text-base md:text-lg font-medium">{status}</p>
        
        <div className="space-y-3">
          <button onClick={onReset} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Main Lagi
          </button>
          <button onClick={onHome} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component Utama ---

export default function ChessGameApp() {
  // Game States
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [showGame, setShowGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // User & App States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'stats' | 'settings'>('home');
  const [progress, setProgress] = useState<any>({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });

  const engine = new ChessEngine();
  
  // Audio Refs
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Init Audio
    if (typeof window !== 'undefined') {
        moveSound.current = new Audio('/move.mp3'); 
        winSound.current = new Audio('/win.mp3');
        loseSound.current = new Audio('/lose.mp3');
    }

    checkUser();
    
    // Listener Auth Change
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
      if (data) setProgress({ highestLevel: data.highest_level, gamesWon: data.games_won, gamesPlayed: data.games_played });
      else {
        // Init data baru jika user baru login pertama kali
        await supabase.from('user_progress').insert([{ user_id: uid }]);
      }
    } catch (e) { console.error("Error fetching progress", e); }
  };

  const playSound = (type: 'move' | 'win' | 'lose') => {
    try {
        if(type === 'move') moveSound.current?.play();
        if(type === 'win') winSound.current?.play();
        if(type === 'lose') loseSound.current?.play();
    } catch (e) { console.log("Audio play failed (file missing?)", e); }
  };

  // --- Game Logic ---

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
    resetGame();
    
    // Jika player hitam, AI jalan duluan (delay dikit biar natural)
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
    setIsPaused(false);
    setIsThinking(false);
  };

  const handleUndo = () => {
    if (game.history().length === 0 || isThinking || gameStatus) return;
    
    game.undo(); 
    if (game.history().length > 0) {
        game.undo();
    }
    
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setBoard(newGame.board());
    setValidMoves([]);
    setSelectedSquare(null);
  };
  
  const handleSaveGame = () => {
    if(userId) {
        localStorage.setItem(`saved_game_${userId}`, JSON.stringify({
            fen: game.fen(),
            level: currentLevel,
            color: playerColor
        }));
        alert("Permainan tersimpan di perangkat ini!");
    }
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
    } catch (e) { console.error(e) }
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
      setGameStatus(playerWon ? '🎉 Anda Menang!' : '💀 Anda Kalah!');
      saveGameResult(playerWon);
    } else if (chess.isDraw()) {
      setGameStatus('🤝 Remis / Seri');
      saveGameResult(false);
    } 
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isThinking || gameStatus || isPaused) return;
    
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
      } catch (e) { setSelectedSquare(null); setValidMoves([]); }
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }));
      }
    }
  };

  // --- Render Views ---

  if (!isLoggedIn) return <LoginCard onLogin={handleLogin} />;

  // TAB: SETTINGS
  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen pb-20 bg-blue-50">
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-b-3xl shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Pengaturan</h1>
          <p className="text-blue-100 text-sm opacity-80">Manage your account & preferences</p>
        </div>

        <div className="px-4 space-y-4 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-100 pb-2">Akun Google</h3>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600">
                  👤
               </div>
               <div className="overflow-hidden">
                  <div className="font-bold text-gray-800 truncate">{userName}</div>
                  <div className="text-sm text-gray-500 truncate">{userEmail}</div>
               </div>
            </div>
            <button onClick={handleLogout} className="w-full py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <IoLogOut size={20} /> Keluar Akun
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 text-center">
            <h3 className="font-bold text-gray-800 mb-2">Tentang Aplikasi</h3>
            <p className="text-gray-600 mb-4 text-sm">Chess Master AI Challenge v1.0</p>
            <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Built by</p>
                <p className="font-bold text-blue-600 text-lg mb-3">Septian Hadi Nugroho</p>
                <a 
                   href="https://instagram.com/septianhnr" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-pink-600 font-semibold hover:text-pink-700 bg-pink-50 px-5 py-2 rounded-full transition-transform hover:scale-105"
                >
                   <IoLogoInstagram size={18} />
                </a>
            </div>
          </div>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // GAME MODE
  if (showGame) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col overflow-hidden">
        {/* Modal Result */}
        <GameResultModal status={gameStatus} onReset={resetGame} onHome={() => { setShowGame(false); resetGame(); }} />

        {/* Top Bar */}
        <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30 shrink-0">
             <button 
                onClick={() => { setShowGame(false); resetGame(); }} 
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                aria-label="Kembali ke Menu"
             >
                <IoArrowBack size={24} />
             </button>
             <div className="font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Level {currentLevel}
             </div>
             <button 
                onClick={resetGame} 
                className="p-2 rounded-full hover:bg-red-50 text-red-500 flex items-center gap-1 bg-red-50 px-3"
                aria-label="Reset Permainan"
             >
                <IoRefresh size={18} /> <span className="text-xs font-bold">Reset</span>
             </button>
        </div>

        {/* Game Content Wrapper - Pakai overflow-y-auto biar kalau layar kecil banget bisa scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col w-full max-w-lg mx-auto">
           
           {/* AI Info Status */}
           <div className="flex justify-between items-center mb-4 px-1 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-lg shadow-md border-2 border-white">
                    🤖
                 </div>
                 <div>
                    <div className="font-bold text-gray-800 leading-tight">AI Computer</div>
                    <div className="text-xs text-gray-500 font-medium h-4">
                       {isThinking ? <span className="text-blue-500 animate-pulse">Sedang berpikir...</span> : 'Menunggu giliran'}
                    </div>
                 </div>
              </div>
           </div>

           {/* Chess Board Area - Responsive Square */}
           <div className="relative rounded-lg shadow-xl overflow-hidden bg-white border-4 border-white w-full aspect-square shrink-0">
              {isPaused && (
                 <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center animate-pop-in p-4">
                        <div className="text-5xl mb-2 text-blue-500">⏸️</div>
                        <h3 className="font-bold text-gray-800 text-xl">Game Dipause</h3>
                        <p className="text-sm text-gray-500 mb-4">Istirahat sejenak, atur strategi.</p>
                        <button onClick={() => setIsPaused(false)} className="bg-blue-600 text-white px-8 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                           Lanjut Main
                        </button>
                    </div>
                 </div>
              )}
              {/* Board Render */}
              <ChessBoard
                board={board}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                onSquareClick={handleSquareClick}
              />
           </div>

           {/* Notifikasi Status */}
           <div className="mt-4 mb-2 min-h-14 flex items-center justify-center shrink-0">
              {game.isCheck() && !gameStatus ? (
                 <div className="bg-red-500 text-white px-6 py-2 rounded-full font-bold animate-pulse shadow-red-200 shadow-lg flex items-center gap-2 text-sm md:text-base">
                    ⚠️ SKAK! Raja dalam bahaya
                 </div>
              ) : !gameStatus ? (
                 <div className={`px-6 py-2 rounded-full font-bold border transition-all shadow-sm text-sm md:text-base ${
                     (game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black')
                     ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                     : 'bg-white text-gray-400 border-gray-200'
                 }`}>
                     {(game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black')
                     ? 'Giliran Anda Jalan'
                     : 'Menunggu AI Jalan...'}
                 </div>
              ) : null}
           </div>

           {/* Control Buttons */}
           <div className="grid grid-cols-3 gap-3 mt-auto mb-4 shrink-0">
              <button onClick={handleUndo} className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-2xl shadow-sm border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all">
                 <IoArrowUndo size={22} className="text-blue-600" />
                 <span className="text-[10px] font-bold text-gray-600">Undo</span>
              </button>
              
              <button onClick={() => setIsPaused(!isPaused)} className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-2xl shadow-sm border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all">
                 <IoPause size={22} className="text-orange-500" />
                 <span className="text-[10px] font-bold text-gray-600">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              
              <button onClick={handleSaveGame} className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-2xl shadow-sm border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all">
                 <IoSave size={22} className="text-green-600" />
                 <span className="text-[10px] font-bold text-gray-600">Simpan</span>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // TAB: HOME DASHBOARD
  if(activeTab === 'leaderboard') return <div className="min-h-screen bg-blue-50"><Leaderboard currentUserId={userId || ''} /><BottomNav activeTab={activeTab} onTabChange={setActiveTab} /></div>;
  if(activeTab === 'stats') return <div className="min-h-screen bg-blue-50"><StatsPage userId={userId || ''} progress={progress} /><BottomNav activeTab={activeTab} onTabChange={setActiveTab} /></div>;

  return (
    <div className="min-h-screen pb-24 bg-blue-50 overflow-x-hidden">
      {/* Hero Header */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 text-center text-white">
           <h1 className="text-2xl md:text-3xl font-bold mb-1">Hai, {userName.split(' ')[0]} 👋</h1>
           <p className="text-blue-100 text-sm mb-6">Siap untuk tantangan catur hari ini?</p>
           
           <div className="flex items-center justify-center gap-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden max-w-xs mx-auto">
              <div className="flex-1 text-center py-3 border-r border-white/20">
                 <div className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Level</div>
                 <div className="text-2xl font-bold text-white leading-none mt-1">{progress.highestLevel}</div>
              </div>
              <div className="flex-1 text-center py-3">
                 <div className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Menang</div>
                 <div className="text-2xl font-bold text-white leading-none mt-1">{progress.gamesWon}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-4 animate-slide-up">
         {/* Level Selector */}
         <LevelSelector
           currentLevel={currentLevel}
           highestLevel={progress.highestLevel}
           onSelectLevel={setCurrentLevel}
         />
         
         {/* Color Selector (Target Scroll dengan ID yang pasti) */}
         <div id="color-selector-section" className="pb-4">
            <ColorSelector onSelectColor={startGame} />
         </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}