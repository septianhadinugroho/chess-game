'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { ChessEngine } from '@/lib/chess-engine';
import { AI_LEVELS } from '@/constants/game-config';
import { getSquareNotation } from '@/utils/helpers';
import { translations, Language } from '@/lib/language';

// Components
import { LoginCard } from '@/components/auth/LoginCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { Leaderboard } from '@/components/pages/Leaderboard';
import { StatsPage } from '@/components/pages/StatsPage';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import { ChessBoard } from '@/components/game/ChessBoard';
import { GameResultModal } from '@/components/game/GameResultModal';
import { Toast } from '@/components/ui/Toast';

// Icons
import { IoLogOut, IoArrowBack, IoRefresh, IoArrowUndo, IoSave, IoLogoInstagram, IoLanguage, IoRocket, IoShieldCheckmark, IoSparkles } from 'react-icons/io5';
import { GiChessKnight, GiRobotGolem } from 'react-icons/gi';

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
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'info' | 'warning' | 'error' });

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

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, message, type });
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

  // Update fungsi startGame dengan "FEN Fallback" agar tidak reset ke awal
  const startGame = async (color: 'white' | 'black' | 'random') => {
    // 1. Cek Save Data
    let savedData = null;
    if (userId) {
      const { data } = await supabase
        .from('saved_games')
        .select('*')
        .eq('user_id', userId)
        .eq('level', currentLevel)
        .single();
      savedData = data;
    }

    // 2. Tentukan Warna (Prioritas warna dari Save Data)
    let chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color;
    if (savedData && savedData.player_color) {
      chosen = savedData.player_color;
    }
    
    setPlayerColor(chosen);
    setShowGame(true);

    // 3. Setup Board (FIXED LOGIC)
    const newGame = new Chess();
    // Ini string FEN posisi awal catur
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    if (savedData) {
      let loadedSuccessfully = false;

      // Opsi A: Coba Load PGN dulu (biar history Undo ada)
      if (savedData.pgn) {
        try {
          newGame.loadPgn(savedData.pgn);
          
          // VALIDASI PENTING (Ini perbaikannya):
          // Kalau setelah loadPgn papannya masih posisi awal, 
          // TAPI data FEN di database BUKAN posisi awal, berarti loadPgn GAGAL (cuma header doang).
          // Kita anggap gagal biar dia lanjut ke Opsi B.
          if (newGame.fen() === START_FEN && savedData.fen !== START_FEN) {
            console.warn("PGN load menghasilkan papan kosong, beralih ke FEN...");
            loadedSuccessfully = false; 
          } else {
            loadedSuccessfully = true;
          }
        } catch (e) {
          console.error("Error loading PGN:", e);
          loadedSuccessfully = false;
        }
      }

      // Opsi B: Fallback ke FEN (Posisi Bidak Pasti Benar)
      // Kalau PGN gagal atau kosong, kita pakai FEN yang akurat dari database
      if (!loadedSuccessfully) {
        try {
          newGame.load(savedData.fen);
          console.log("Berhasil load via FEN");
        } catch (e) {
          console.error("Error loading FEN:", e);
        }
      }

      showToast(t.gameLoaded, 'info');
    }

    setGame(newGame);
    setBoard(newGame.board());

    // 4. Handle Giliran AI (Auto Move saat Resume)
    // Cek giliran dari game yang baru di-load (misal save saat giliran Hitam)
    const currentTurn = newGame.turn(); // 'w' atau 'b'
    const playerSide = chosen.charAt(0); // 'w' atau 'b'

    // Jika giliran sekarang bukan giliran player, suruh AI jalan
    if (currentTurn !== playerSide) {
       setTimeout(() => makeAIMove(newGame), 800);
    }
  };

  // Ubah resetGame supaya bisa 'pilih-pilih'
  const resetGame = async (deleteSave = false) => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameStatus('');
    setIsThinking(false);
    
    // Hapus dari database CUMA KALAU diminta (deleteSave = true)
    if (userId && deleteSave) {
      await supabase
        .from('saved_games')
        .delete()
        .eq('user_id', userId)
        .eq('level', currentLevel);
      
      showToast('Game di-reset', 'info');
    }
  };

  const handleUndo = () => {
    // Cek apakah ada move yang bisa di-undo
    const history = game.history();
    
    // Minimal harus ada 1 move dari player untuk bisa undo
    if (history.length < 1 || isThinking || gameStatus) {
      return;
    }
    
    // Undo last move (AI's move if exists)
    if (history.length > 0) {
      game.undo();
    }
    
    // Undo player's last move
    if (history.length > 1) {
      game.undo();
    }
    
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setBoard(newGame.board());
    setValidMoves([]);
    setSelectedSquare(null);
    
    showToast(t.moveCanceled, 'info');
  };
  
  const handleSaveGame = async () => {
    const history = game.history();
    if (!userId || gameStatus || history.length === 0) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('saved_games')
        .upsert({ 
          user_id: userId,
          fen: game.fen(),
          pgn: game.pgn(),
          level: currentLevel,
          player_color: playerColor,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast(t.gameSaved, 'success');
    } catch (e) {
      console.error('Save error:', e);
      showToast('Gagal menyimpan game', 'error');
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
        
        const newGame = new Chess();
        newGame.loadPgn(currentGame.pgn());

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
          
          const newGame = new Chess();
          newGame.loadPgn(game.pgn());
          
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

  if (!isLoggedIn) {
    return <LoginCard onLogin={handleLogin} language={language} onLanguageToggle={toggleLanguage} />;
  }

  // Settings Page
  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Toast 
          message={toast.message} 
          show={toast.show} 
          type={toast.type}
          onHide={() => setToast({ ...toast, show: false })} 
        />
        
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-8 shadow-lg mb-6">
          <div className="max-w-lg mx-auto text-center text-white">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-md">{t.settings}</h1>
            <p className="text-sm text-gray-100 font-medium">{t.manageAccount}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 space-y-4 animate-slide-up">
          {/* Account Card */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 text-lg pb-2 border-b border-gray-100 flex items-center gap-2">
              <GiChessKnight className="text-xl text-blue-600" /> {t.googleAccount}
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <GiChessKnight className="text-3xl text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-gray-800 truncate text-lg">{userName}</div>
                <div className="text-sm text-gray-500 truncate">{userEmail}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all touch-feedback flex items-center justify-center gap-2"
            >
              <IoLogOut size={20} /> {t.logout}
            </button>
          </div>

          {/* Language Card - NEW DESIGN */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 text-lg pb-2 border-b border-gray-100 flex items-center gap-2">
              <IoLanguage className="text-xl text-blue-600" /> {t.language}
            </h3>
            
            <div className="bg-gray-100 p-1.5 rounded-2xl flex relative">
              <button
                onClick={() => language !== 'id' && toggleLanguage()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 touch-feedback ${
                  language === 'id' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">🇮🇩</span> Indonesia
              </button>
              <button
                onClick={() => language !== 'en' && toggleLanguage()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 touch-feedback ${
                  language === 'en' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">🇬🇧</span> English
              </button>
            </div>
          </div>

          {/* About Card */}
          <div className="card text-center">
            <h3 className="font-bold text-gray-800 mb-2 text-lg">{t.aboutApp}</h3>
            <p className="text-gray-500 mb-4 text-sm">{t.appVersion}</p>
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">{t.builtBy}</p>
              <p className="font-bold text-blue-600 text-xl mb-3">Septian Hadi Nugroho</p>
              <a 
                href="https://instagram.com/septianhnr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-500 bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-200 px-6 py-3 rounded-2xl transition-all hover:shadow-md touch-feedback"
              >
                <IoLogoInstagram size={20} />
                @septianhnr
              </a>
            </div>
          </div>
        </div>
        
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Game Screen
  if (showGame) {
    const history = game.history();
    // Undo bisa dilakukan jika ada minimal 1 move dan game belum selesai
    const canUndo = history.length >= 1 && !isThinking && !gameStatus;
    // Save bisa dilakukan jika ada move dan game belum selesai
    const canSave = history.length > 0 && !gameStatus && !isThinking;
    
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
          onReset={resetGame} 
          onHome={() => { setShowGame(false); resetGame(); }} 
          language={language} 
        />

        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <button 
            onClick={() => { setShowGame(false); resetGame(); }} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors touch-feedback"
            aria-label="Back to menu"
          >
            <IoArrowBack size={24} />
          </button>
          <div className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow"></span>
            {t.level} {currentLevel}
          </div>
          <button 
            onClick={() => resetGame(true)}
            className="p-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-1 bg-red-50/50 px-3 border border-red-200 transition-colors touch-feedback"
            aria-label="Reset game"
          >
            <IoRefresh size={18} /> <span className="text-xs font-bold">{t.reset}</span>
          </button>
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
                <div className="font-bold text-gray-800 leading-tight">{t.aiPlayer}</div> {/* Updated */}
                <div className="text-xs text-gray-500 font-medium h-4">
                  {isThinking ? (
                    <span className="text-blue-600 animate-pulse-slow">{t.aiThinking}</span>
                  ) : (
                    t.waitingTurn
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chess Board */}
          <ChessBoard
            board={board}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
          />

          {/* Game Status */}
          <div className="mt-4 mb-2 min-h-14 flex items-center justify-center">
            {game.isCheck() && !gameStatus ? (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold animate-pulse-slow shadow-lg flex items-center gap-2 text-sm">
                <IoShieldCheckmark size={18} />
                {t.check}
              </div>
            ) : !gameStatus ? (
              <div className={`px-6 py-2 rounded-full font-bold border-2 transition-all shadow-sm text-sm flex items-center gap-2 ${
                  (game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black')
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-400 shadow-blue-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}>
                  {(game.turn() === 'w' && playerColor === 'white') || (game.turn() === 'b' && playerColor === 'black') ? (
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
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl shadow-sm transition-all ${
                canUndo
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 text-blue-600 hover:shadow-md touch-feedback'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Undo move"
            >
              <IoArrowUndo size={24} />
              <span className="text-xs font-bold">{t.undo}</span>
            </button>
            
            <button 
              onClick={handleSaveGame} 
              disabled={!canSave}
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl shadow-sm transition-all ${
                canSave
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-600 hover:shadow-md touch-feedback'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Save game"
            >
              <IoSave size={24} />
              <span className="text-xs font-bold">{t.save}</span>
            </button>
          </div>

          {/* Human Player Info */}
          <div className="flex justify-between items-center mt-2 px-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center shadow-lg">
                <GiChessKnight className="text-2xl" />
              </div>
              <div>
                <div className="font-bold text-gray-800 leading-tight">{userName.split(' ')[0]}</div>
                <div className="text-xs text-gray-500 font-medium">{t.youPlayer}</div> {/* Updated */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Other tabs
  if(activeTab === 'leaderboard') {
    return (
      <div className="min-h-screen">
        <Leaderboard currentUserId={userId || ''} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }
  
  if(activeTab === 'stats') {
    return (
      <div className="min-h-screen">
        <StatsPage userId={userId || ''} progress={progress} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Home Screen
  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Toast 
        message={toast.message} 
        show={toast.show} 
        type={toast.type}
        onHide={() => setToast({ ...toast, show: false })} 
      />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-6 md:p-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        {/* <div className="absolute top-4 right-4">
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all touch-feedback backdrop-blur-sm"
            aria-label="Change language"
          >
            <IoLanguage size={20} />
          </button>
        </div> */}
        
        <div className="relative z-10 text-center text-white max-w-lg mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 drop-shadow-md flex items-center justify-center gap-2">
            {t.greeting}, {userName.split(' ')[0]}! <IoSparkles className="text-yellow-300 animate-bounce-slow" />
          </h1>
          <p className="text-blue-100 text-sm mb-6 font-medium">{t.readyMessage}</p>
          
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow-lg">
              <div className="text-xs text-blue-100 uppercase tracking-wider font-bold mb-1">{t.level}</div>
              <div className="text-3xl font-black text-white leading-none">{progress.highestLevel}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow-lg">
              <div className="text-xs text-blue-100 uppercase tracking-wider font-bold mb-1">{t.wins}</div>
              <div className="text-3xl font-black text-white leading-none">{progress.gamesWon}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-20 space-y-4 animate-slide-up">
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