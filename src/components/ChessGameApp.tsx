'use client';

import React, { useState, useEffect } from 'react';
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
import { GameStatus } from '@/components/game/GameStatus';
import { ChessBoard } from '@/components/game/ChessBoard';
import { IoLogOut, IoArrowBack } from 'react-icons/io5';

interface UserProgress {
  highestLevel: number;
  gamesWon: number;
  gamesPlayed: number;
}

export default function ChessGameApp() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'stats' | 'settings'>('home');
  const [showGame, setShowGame] = useState(false);
  const [progress, setProgress] = useState<UserProgress>({ 
    highestLevel: 1, 
    gamesWon: 0, 
    gamesPlayed: 0 
  });
  
  const engine = new ChessEngine();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || 'Player');
        setUserId(session.user.id);
        fetchProgress(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
        setActiveTab('home');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsLoggedIn(true);
      setUserName(session.user.user_metadata.full_name || 'Player');
      setUserId(session.user.id);
      await fetchProgress(session.user.id);
    }
  };

  const fetchProgress = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error && error.code !== 'PGRST116') return;

      if (data) {
        setProgress({
          highestLevel: data.highest_level,
          gamesWon: data.games_won,
          gamesPlayed: data.games_played
        });
      } else {
        await supabase.from('user_progress').insert([{ user_id: uid }]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const saveGameResult = async (won: boolean) => {
    if (!userId) return;
    try {
      await supabase.from('user_progress').update({
        games_played: progress.gamesPlayed + 1,
        games_won: won ? progress.gamesWon + 1 : progress.gamesWon,
        highest_level: won && currentLevel < 10 
          ? Math.max(progress.highestLevel, currentLevel + 1) 
          : progress.highestLevel
      }).eq('user_id', userId);

      await supabase.from('game_history').insert([{
        user_id: userId,
        level: currentLevel,
        player_color: playerColor === 'white' ? 'white' : 'black',
        result: won ? 'win' : 'lose',
        moves_count: game.history().length,
        pgn: game.pgn()
      }]);

      await fetchProgress(userId);
    } catch (err) {
      console.error('Error saving game:', err);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) alert('Gagal login. Pastikan Google OAuth sudah dikonfigurasi.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
    setShowGame(false);
    setProgress({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });
  };

  const startGame = (color: 'white' | 'black' | 'random') => {
    const chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color;
    setPlayerColor(chosen);
    setShowGame(true);
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
      const playerWon = (chess.turn() === 'b' && playerColor === 'white') || 
                       (chess.turn() === 'w' && playerColor === 'black');
      setGameStatus(playerWon ? '🎉 Skakmat! Anda Menang!' : '😔 Skakmat! AI Menang');
      saveGameResult(playerWon);
    } else if (chess.isDraw()) {
      setGameStatus('🤝 Remis! Seri');
      saveGameResult(false);
    } else if (chess.isCheck()) {
      setGameStatus('⚠️ Skak!');
    } else {
      setGameStatus('');
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isThinking || gameStatus.includes('Menang') || gameStatus.includes('Remis')) return;
    const isPlayerTurn = (game.turn() === 'w' && playerColor === 'white') || 
                         (game.turn() === 'b' && playerColor === 'black');
    if (!isPlayerTurn) return;

    const square = getSquareNotation(row, col) as Square;
    const piece = board[row][col];

    if (selectedSquare) {
      try {
        const result = game.move({ from: selectedSquare as Square, to: square, promotion: 'q' });
        if (result) {
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

  if (!isLoggedIn) return <LoginCard onLogin={handleLogin} />;

  // Settings Page
  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen pb-20">
        <div className="bg-linear-to-br from-gray-700 via-gray-800 to-gray-900 p-6 mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/80 text-sm">{userName}</p>
        </div>

        <div className="px-4 space-y-3">
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Account</h3>
            <div className="text-sm text-gray-600 mb-3">
              Logged in as <span className="font-semibold">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
            >
              <IoLogOut /> Sign Out
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">About</h3>
            <p className="text-sm text-gray-600">Chess Master v1.0</p>
            <p className="text-xs text-gray-500 mt-1">Built with Next.js & Supabase</p>
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'leaderboard') {
    return (
      <div className="min-h-screen">
        <Leaderboard currentUserId={userId || ''} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'stats') {
    return (
      <div className="min-h-screen">
        <StatsPage userId={userId || ''} progress={progress} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Game Page
  if (showGame) {
    return (
      <div className="min-h-screen pb-4">
        <div className="bg-white/95 backdrop-blur shadow-sm sticky top-0 z-40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowGame(false)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <IoArrowBack /> Back
            </button>
            <div className="text-sm font-semibold text-gray-700">
              Level {currentLevel}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 mb-4">
            <GameStatus status={gameStatus} isThinking={isThinking} currentTurn={game.turn()} />
            <button
              onClick={resetGame}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md"
            >
              Reset Game
            </button>
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

  // Home Page
  return (
    <div className="min-h-screen pb-20">
      <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 mb-4">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-white/90">{userName}</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div>Level <span className="font-bold">{progress.highestLevel}</span></div>
            <div>•</div>
            <div><span className="font-bold">{progress.gamesWon}</span> Wins</div>
          </div>
        </div>
      </div>

      <div className="px-4 animate-slide-up">
        <LevelSelector
          currentLevel={currentLevel}
          highestLevel={progress.highestLevel}
          onSelectLevel={setCurrentLevel}
        />
        <ColorSelector onSelectColor={startGame} />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}