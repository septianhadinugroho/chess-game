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
import ModeSelector from '@/components/menu/ModeSelector';
import MultiplayerLobby from '@/components/multiplayer/MultiplayerLobby';
import EnhancedChessBoard from '@/components/game/EnhancedChessBoard';
import MoveHistory from '@/components/game/MoveHistory';
import { GameResultModal } from '@/components/game/GameResultModal';
import { Toast } from '@/components/ui/Toast';

// Icons
import { 
  IoLogOut, IoArrowBack, IoRefresh, IoArrowUndo, IoSave, 
  IoLogoInstagram, IoLanguage, IoRocket, IoShieldCheckmark, IoList 
} from 'react-icons/io5';
import { GiChessKnight, GiRobotGolem } from 'react-icons/gi';

type GameMode = 'ai' | 'multiplayer' | null;

export default function ChessGameApp() {
  // --- STATE MANAGEMENT ---
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [showGame, setShowGame] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'stats' | 'settings'>('home');
  const [progress, setProgress] = useState<any>({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });
  const [language, setLanguage] = useState<Language>('id');
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'info' | 'warning' | 'error' });

  // Multiplayer states
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  
  // Timer states
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  
  // Move history
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [showMoveHistory, setShowMoveHistory] = useState(false);

  const engine = new ChessEngine();
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  const t = translations[language];

  // --- EFFECTS ---

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

  // Timer effect
  useEffect(() => {
    if (!timerActive || gameStatus || gameMode !== 'ai') return;

    const interval = setInterval(() => {
      const currentTurn = game.turn();
      
      if (currentTurn === 'w') {
        setWhiteTime(prev => {
          if (prev <= 0) {
            setGameStatus('⏰ Waktu Habis - Hitam Menang!');
            saveGameResult(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 0) {
            setGameStatus('⏰ Waktu Habis - Putih Menang!');
            saveGameResult(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, game, gameStatus, gameMode]);

  // 1. Dengerin Perubahan Room & Moves dari Database
  useEffect(() => {
    if (!currentRoomId || gameMode !== 'multiplayer') return;

    // A. Ambil Data Room Awal (Warna & Posisi Bidak)
    const fetchRoomData = async () => {
      const { data: room } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', currentRoomId)
        .single();
      
      if (room) {
        // Load posisi bidak dari DB
        const newGame = new Chess(room.current_fen);
        setGame(newGame);
        setBoard(newGame.board());
        setMoveHistory(newGame.history()); // Load history kalau rejoin
        
        // TENTUIN WARNA PLAYER (Ini fix biar gak null/salah warna!)
        // Logic: Kalo gw Host -> Pake warna Host. Kalo bukan -> Warna lawannya.
        const myColor = userId === room.host_user_id 
          ? room.host_color 
          : (room.host_color === 'white' ? 'black' : 'white');
        
        setPlayerColor(myColor);
        setShowGame(true); // Tampilin board
      }
    };

    fetchRoomData();

    // B. Subscribe Realtime (Biar bidak gerak sendiri pas lawan jalan)
    const channel = supabase
      .channel(`room_${currentRoomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_moves', 
        filter: `room_id=eq.${currentRoomId}` 
      }, (payload) => {
        const moveData = payload.new;
        // Cuma update kalau move ini DARI LAWAN (bukan move kita sendiri)
        if (moveData.player_id !== userId) {
          const newGame = new Chess(moveData.fen);
          setGame(newGame);
          setBoard(newGame.board());
          setMoveHistory(newGame.history());
          setLastMove({ from: moveData.from_square, to: moveData.to_square });
          playSound('move');
          checkGameStatus(newGame); // Cek skakmat/remis
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, gameMode, userId]);

  // --- HELPER FUNCTIONS ---

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

  // --- AUTH & NAVIGATION HANDLERS ---

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
    setGameMode(null);
    setActiveTab('home');
  };

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'multiplayer') {
      setShowMultiplayerLobby(true);
    }
  };

  const handleJoinRoom = (roomId: string, roomCode: string) => {
    setCurrentRoomId(roomId);
    setShowMultiplayerLobby(false);
    showToast(`Joined room: ${roomCode}`, 'success');
  };

  // --- GAME LOGIC ---

  const startGame = async (color: 'white' | 'black' | 'random') => {
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

    let chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color;
    if (savedData && savedData.player_color) {
      chosen = savedData.player_color;
    }
    
    setPlayerColor(chosen);
    setShowGame(true);
    setTimerActive(true);
    setMoveHistory([]);
    setLastMove(null);

    const newGame = new Chess();
    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    if (savedData) {
      let loadedSuccessfully = false;

      if (savedData.pgn) {
        try {
          newGame.loadPgn(savedData.pgn);
          if (newGame.fen() === START_FEN && savedData.fen !== START_FEN) {
            loadedSuccessfully = false;
          } else {
            loadedSuccessfully = true;
            setMoveHistory(newGame.history());
          }
        } catch (e) {
          loadedSuccessfully = false;
        }
      }

      if (!loadedSuccessfully) {
        try {
          newGame.load(savedData.fen);
        } catch (e) {
          console.error("Error loading FEN:", e);
        }
      }

      showToast(t.gameLoaded, 'info');
    }

    setGame(newGame);
    setBoard(newGame.board());

    const currentTurn = newGame.turn();
    const playerSide = chosen.charAt(0);

    if (currentTurn !== playerSide) {
       setTimeout(() => makeAIMove(newGame), 800);
    }
  };

  const resetGame = async (deleteSave = false) => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameStatus('');
    setIsThinking(false);
    setMoveHistory([]);
    setLastMove(null);
    setTimerActive(false);
    setWhiteTime(600);
    setBlackTime(600);
    
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
    const history = game.history();
    
    if (history.length < 1 || isThinking || gameStatus) {
      return;
    }
    
    if (history.length > 0) {
      game.undo();
    }
    
    if (history.length > 1) {
      game.undo();
    }
    
    const newGame = new Chess(game.fen());
    setGame(newGame);
    setBoard(newGame.board());
    setValidMoves([]);
    setSelectedSquare(null);
    setMoveHistory(newGame.history());
    setLastMove(null);
    
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
        const from = bestMove.from;
        const to = bestMove.to;
        
        currentGame.move(bestMove);
        playSound('move');
        
        const newGame = new Chess();
        newGame.loadPgn(currentGame.pgn());

        setGame(newGame);
        setBoard(newGame.board());
        setMoveHistory(newGame.history());
        setLastMove({ from, to });
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
      setTimerActive(false);
    } else if (chess.isDraw()) {
      setGameStatus(`🤝 ${t.draw}`);
      saveGameResult(false);
      setTimerActive(false);
    }
  };

  const handleSquareClick = async (row: number, col: number) => {
    if (isThinking || gameStatus) return;
    
    // Validasi Giliran: Gaboleh gerak kalau bukan giliran warna kita
    if ((game.turn() === 'w' && playerColor === 'black') || 
        (game.turn() === 'b' && playerColor === 'white')) return;

    const square = getSquareNotation(row, col) as Square;
    const piece = board[row][col];

    // Logic Pilih Square / Jalanin Bidak
    if (selectedSquare) {
      try {
        const move = { from: selectedSquare as Square, to: square, promotion: 'q' };
        // Cek validitas move pake library chess.js
        const validMove = game.moves({ verbose: true }).find(m => m.from === selectedSquare && m.to === square);
        
        if (validMove) {
          game.move(move); // Update lokal biar cepet
          playSound('move');
          
          const newGame = new Chess(game.fen());
          setGame(newGame);
          setBoard(newGame.board());
          setSelectedSquare(null);
          setValidMoves([]);
          setMoveHistory(newGame.history());
          setLastMove({ from: selectedSquare, to: square });
          
          checkGameStatus(newGame);

          // === CABANG LOGIKA (AI vs MULTIPLAYER) ===
          
          if (gameMode === 'ai') {
            // Mode AI: Suruh bot mikir
            if (!newGame.isGameOver()) makeAIMove(newGame);
            
          } else if (gameMode === 'multiplayer' && currentRoomId) {
            // Mode Online: KIRIM MOVE KE DATABASE
            await supabase.from('game_moves').insert({
              room_id: currentRoomId,
              player_id: userId,
              from_square: selectedSquare,
              to_square: square,
              fen: newGame.fen(),
              san: validMove.san,
              move_number: game.history().length
            });

            // Update status Room (biar tau giliran siapa & FEN terakhir)
            await supabase.from('game_rooms').update({
              current_fen: newGame.fen(),
              last_move_at: new Date().toISOString()
            }).eq('id', currentRoomId);
          }
        } else {
          // Kalau klik bidak sendiri (ganti seleksi)
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
      // Klik pertama (pilih bidak)
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }));
      }
    }
  };

  // --- RENDERING ---

  if (!isLoggedIn) {
    return <LoginCard onLogin={handleLogin} language={language} onLanguageToggle={toggleLanguage} />;
  }

  // Multiplayer Lobby
  if (showMultiplayerLobby && gameMode === 'multiplayer') {
    return (
      <MultiplayerLobby
        userId={userId || ''}
        language={language}
        onJoinRoom={handleJoinRoom}
        onBack={() => {
          setShowMultiplayerLobby(false);
          setGameMode(null);
        }}
      />
    );
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

          <div className="card text-center">
            <h3 className="font-bold text-gray-800 mb-2 text-lg">{t.aboutApp}</h3>
            <p className="text-gray-500 mb-4 text-sm">Chess Master V2.0</p>
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

  // Game Screen (AI Mode)
  if (showGame && gameMode === 'ai') {
    const history = game.history();
    const canUndo = history.length >= 1 && !isThinking && !gameStatus;
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
          onHome={() => { setShowGame(false); setGameMode(null); resetGame(); }} 
          language={language} 
        />

        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <button 
            onClick={() => { setShowGame(false); setGameMode(null); resetGame(); }} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors touch-feedback"
            aria-label={t.backToMenu}
          >
            <IoArrowBack size={24} />
          </button>
          <div className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow"></span>
            {t.level} {currentLevel}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowMoveHistory(!showMoveHistory)}
              className={`p-2 rounded-xl flex items-center gap-1 px-3 border transition-colors touch-feedback ${
                showMoveHistory
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-blue-50 text-blue-600 border-blue-200'
              }`}
              aria-label="Toggle Move History"
            >
              <IoList size={18} />
            </button>
            <button 
              onClick={() => resetGame(true)}
              className="p-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-1 bg-red-50/50 px-3 border border-red-200 transition-colors touch-feedback"
              aria-label={t.reset}
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
                  {isThinking ? (
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
              <MoveHistory moves={moveHistory} language={language} compact />
            </div>
          )}

          {/* Chess Board */}
          <EnhancedChessBoard
            board={board}
            orientation={playerColor === 'black' ? 'black' : 'white'}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
            showTimer={false}
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

          {/* Control Buttons (Undo/Save) */}
          <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-feedback ${
                canUndo
                  ? 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
                  : 'bg-gray-100 text-gray-400 border-2 border-transparent'
              }`}
            >
              <IoArrowUndo size={20} />
              {t.undo}
            </button>
            <button
              onClick={handleSaveGame}
              disabled={!canSave}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all touch-feedback ${
                canSave
                  ? 'bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-200 shadow-sm'
                  : 'bg-gray-100 text-gray-400 border-2 border-transparent'
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

  // === TAMBAHAN BARU: Multiplayer Screen ===
  else if (showGame && gameMode === 'multiplayer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col">
        {/* Reuse komponen yang udah ada */}
        <Toast message={toast.message} show={toast.show} type={toast.type} onHide={() => setToast({ ...toast, show: false })} />
        <GameResultModal status={gameStatus} onReset={() => {}} onHome={() => { setShowGame(false); setGameMode(null); }} language={language} />

        {/* Header Multiplayer */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <button 
            onClick={() => { setShowGame(false); setGameMode(null); }} 
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700"
            aria-label={language === 'id' ? 'Kembali ke Menu' : 'Back to Menu'}
          >
            <IoArrowBack size={24} />
          </button>
          <div className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Online Match
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Area Board */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-2xl mx-auto w-full justify-center">
          
          {/* Info Lawan */}
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold border-2 border-gray-300">
                OP
              </div>
              <div>
                <div className="font-bold text-gray-800">Opponent</div>
                <div className="text-xs text-gray-500">
                   {/* Indikator Giliran Lawan */}
                   {(game.turn() === 'w' && playerColor === 'black') || (game.turn() === 'b' && playerColor === 'white') 
                     ? <span className="text-blue-600 font-bold animate-pulse">Thinking...</span>
                     : "Waiting..."}
                </div>
              </div>
            </div>
          </div>

          {/* CHESS BOARD */}
          <EnhancedChessBoard
            board={board}
            orientation={playerColor || 'white'} // Pastikan orientasi sesuai warna kita!
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
            showTimer={false}
          />

          {/* Info Kita */}
          <div className="mt-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200">
                ME
              </div>
              <div>
                <div className="font-bold text-gray-800">{userName}</div>
                <div className="text-xs font-bold text-blue-600 capitalize">{playerColor} Pieces</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Leaderboard currentUserId={userId || ''} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Stats Tab
  if (activeTab === 'stats') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <StatsPage userId={userId || ''} progress={progress} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Default: Home Tab
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Toast
        message={toast.message}
        show={toast.show}
        type={toast.type}
        onHide={() => setToast({ ...toast, show: false })}
      />

      {/* Home Header - Simplified & Compact */}
      <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-4 shadow-sm mb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-blue-100 text-xs font-medium mb-0.5">{language === 'id' ? 'Halo,' : 'Hi,'}</p>
              <h1 className="text-xl font-bold text-white">
                {isLoggedIn ? userName.split(' ')[0] : 'Guest'} 👋
              </h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-lg">
              <span className="text-[10px] font-medium opacity-90 block">{t.level}</span>
              <span className="text-lg font-black">{progress.highestLevel}</span>
            </div>
          </div>
          
          {/* Quick Stats - Compact */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex justify-around border border-white/20">
            <div className="text-center">
              <p className="text-[10px] text-blue-100 mb-0.5 font-medium">{language === 'id' ? 'Main' : 'Played'}</p>
              <p className="font-bold text-white text-base">{progress.gamesPlayed}</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <p className="text-[10px] text-blue-100 mb-0.5 font-medium">{language === 'id' ? 'Menang' : 'Won'}</p>
              <p className="font-bold text-white text-base">{progress.gamesWon}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 animate-slide-up">
        {!gameMode ? (
          /* Mode Selector (AI / Multiplayer) */
          <ModeSelector onSelectMode={handleModeSelect} language={language} />
        ) : gameMode === 'ai' ? (
          /* AI Setup Menu */
          <div className="space-y-4" id="ai-setup-section">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setGameMode(null)}
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-600"
                aria-label={t.backToMenu}
              >
                <IoArrowBack size={24} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">{language === 'id' ? 'Setup Permainan' : 'Game Setup'}</h2>
            </div>
            <LevelSelector 
              currentLevel={currentLevel} 
              onSelectLevel={(level) => {
                setCurrentLevel(level);
                // Auto scroll ke color selector setelah pilih level
                setTimeout(() => {
                  const colorSection = document.getElementById('color-selector-section');
                  if (colorSection) {
                    const elementPosition = colorSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 80;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }, 200);
              }}
              highestLevel={progress.highestLevel}
              language={language}
            />
            
            <div id="color-selector-section">
              <ColorSelector 
                onSelectColor={(color) => {
                  setPlayerColor(color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color);
                  startGame(color);
                }}
                language={language}
              />
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  );
}