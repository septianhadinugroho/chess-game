'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { supabase } from '@/lib/supabase'; // Koneksi Supabase
import { ChessEngine } from '@/lib/chess-engine';
import { AI_LEVELS } from '@/constants/game-config';
import { getSquareNotation } from '@/utils/helpers';

// Components
import { LoginCard } from '@/components/auth/LoginCard';
import { Header } from '@/components/layout/Header';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import { UserStats } from '@/components/menu/UserStats';
import { GameStatus } from '@/components/game/GameStatus';
import { ChessBoard } from '@/components/game/ChessBoard';

export default function ChessGameApp() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [gameStatus, setGameStatus] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [progress, setProgress] = useState({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });
  
  const engine = new ChessEngine();

  // 1. CEK USER SESSION SUPABASE SAAT LOAD
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || 'Player');
        setUserAvatar(session.user.user_metadata.avatar_url);
        fetchProgress(session.user.id);
      }
    };
    checkUser();
    
    // Listener untuk perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            setIsLoggedIn(true);
            setUserName(session.user.user_metadata.full_name || 'Player');
            fetchProgress(session.user.id);
        } else {
            setIsLoggedIn(false);
            setUserName('');
            setShowMenu(true);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch progress dari Database
  const fetchProgress = async (userId: string) => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data) {
          setProgress({
              highestLevel: data.highest_level,
              gamesWon: data.games_won,
              gamesPlayed: data.games_played
          });
      } else {
          // Jika user baru, buat entry
          await supabase.from('user_progress').insert([{ user_id: userId }]);
      }
  };

  // 2. FUNGSI LOGIN GOOGLE
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Penting!
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
  };

  // Update Progress ke Database
  const updateDBProgress = async (updates: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase
            .from('user_progress')
            .update({
                highest_level: updates.highestLevel || progress.highestLevel,
                games_won: updates.gamesWon || progress.gamesWon,
                games_played: updates.gamesPlayed || progress.gamesPlayed,
                updated_at: new Date()
            })
            .eq('user_id', user.id);
    }
  };

  const saveProgressState = (updates: any) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    updateDBProgress(newProgress);
  };

  // ... (SISA LOGIKA GAME SAMA SEPERTI KODE LAMA KAMU: startGame, resetGame, makeAIMove, checkGameStatus, handleSquareClick)
  // Cukup copy-paste fungsi-fungsi logic game tersebut ke sini.
  // Pastikan saat 'checkGameStatus' memanggil 'saveProgressState'
  
  // Contoh potongan startGame:
  const startGame = (color: 'white' | 'black' | 'random') => {
    const chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color;
    setPlayerColor(chosen);
    setShowMenu(false);
    resetGame();
    if (chosen === 'black') {
      setTimeout(() => makeAIMove(new Chess()), 500);
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameStatus('');
  };

  const makeAIMove = (currentGame: Chess) => {
    setIsThinking(true);
    setTimeout(() => {
      const aiConfig = AI_LEVELS[currentLevel - 1];
      const bestMove = engine.getBestMove(currentGame, aiConfig.depth, playerColor === 'black');
      if (bestMove) {
        currentGame.move(bestMove);
        setGame(new Chess(currentGame.fen()));
        setBoard(currentGame.board());
        checkGameStatus(currentGame);
      }
      setIsThinking(false);
    }, 400);
  };

  const checkGameStatus = (chess: Chess) => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Hitam' : 'Putih';
      const playerWon = (winner === 'Putih' && playerColor === 'white') || 
                        (winner === 'Hitam' && playerColor === 'black');
      
      setGameStatus(playerWon ? '🎉 Selamat! Kamu Menang!' : '😔 AI Menang, Coba Lagi!');
      
      if (playerWon) {
        saveProgressState({
          highestLevel: Math.max(progress.highestLevel, currentLevel < 10 ? currentLevel + 1 : currentLevel),
          gamesWon: progress.gamesWon + 1,
          gamesPlayed: progress.gamesPlayed + 1
        });
      } else {
        saveProgressState({ gamesPlayed: progress.gamesPlayed + 1 });
      }
    } else if (chess.isDraw()) {
      setGameStatus('🤝 Permainan Seri');
      saveProgressState({ gamesPlayed: progress.gamesPlayed + 1 });
    } else if (chess.isCheck()) {
      setGameStatus('⚠️ Skak!');
    } else {
      setGameStatus('');
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isThinking || gameStatus.includes('Menang') || gameStatus.includes('Seri')) return;
    
    const isPlayerTurn = (game.turn() === 'w' && playerColor === 'white') || 
                         (game.turn() === 'b' && playerColor === 'black');
    
    if (!isPlayerTurn) return;

    const square = getSquareNotation(row, col);
    const piece = board[row][col];

    if (selectedSquare) {
      try {
        const result = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (result) {
          const newGame = new Chess(game.fen());
          setGame(newGame);
          setBoard(newGame.board());
          setSelectedSquare(null);
          setValidMoves([]);
          checkGameStatus(newGame);
          if (!newGame.isGameOver()) makeAIMove(newGame);
        } else {
          // Logic seleksi ulang (sama seperti kodemu)
          if (piece && piece.color === game.turn()) {
             setSelectedSquare(square);
             setValidMoves(game.moves({ square, verbose: true }));
          } else {
             setSelectedSquare(null);
             setValidMoves([]);
          }
        }
      } catch (e) {
          // Fallback logic
          if (piece && piece.color === game.turn()) {
             setSelectedSquare(square);
             setValidMoves(game.moves({ square, verbose: true }));
          } else {
             setSelectedSquare(null);
             setValidMoves([]);
          }
      }
    } else {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setValidMoves(game.moves({ square, verbose: true }));
      }
    }
  };

  // RENDER UI
  if (!isLoggedIn) {
    return <LoginCard onLogin={handleLogin} />;
  }

  if (showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <Header userName={userName} highestLevel={progress.highestLevel} onLogout={handleLogout} showBackButton={false} />
        <div className="max-w-md mx-auto mt-4">
          <LevelSelector currentLevel={currentLevel} highestLevel={progress.highestLevel} onSelectLevel={setCurrentLevel} />
          <ColorSelector onSelectColor={startGame} />
          <UserStats gamesWon={progress.gamesWon} gamesPlayed={progress.gamesPlayed} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header userName={userName} highestLevel={progress.highestLevel} onLogout={handleLogout} onBackToMenu={() => setShowMenu(true)} showBackButton={true} />
      
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-3">
          <div className="text-center mb-3">
            <div className="text-lg font-bold text-gray-800">
              Level {currentLevel}: {AI_LEVELS[currentLevel - 1].name}
            </div>
            <div className="text-sm text-gray-600">
              Kamu main: {playerColor === 'white' ? '♔ Putih' : '♚ Hitam'}
            </div>
          </div>
          
          <GameStatus status={gameStatus} isThinking={isThinking} currentTurn={game.turn()} />
          
          <div className="flex gap-2 mb-3">
            <button onClick={resetGame} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all">
              🔄 Reset
            </button>
            {(gameStatus.includes('Menang') || gameStatus.includes('Seri')) && currentLevel < 10 && gameStatus.includes('Kamu') && (
              <button 
                onClick={() => {
                  setCurrentLevel(currentLevel + 1);
                  startGame(playerColor!);
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                ➡️ Level Berikutnya
              </button>
            )}
          </div>
        </div>

        <ChessBoard 
          board={board} 
          selectedSquare={selectedSquare} 
          validMoves={validMoves} 
          onSquareClick={handleSquareClick} 
        />
      </div>
    </div>
  );
}