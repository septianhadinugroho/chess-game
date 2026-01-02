'use client';

import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js'; // TAMBAHKAN Square DISINI
import { supabase } from '@/lib/supabase';
import { ChessEngine } from '@/lib/chess-engine';
import { AI_LEVELS } from '@/constants/game-config';
import { getSquareNotation } from '@/utils/helpers';

// Pastikan import ini sesuai dengan nama file kamu
import { LoginCard } from '@/components/auth/LoginCard';
import { Header } from '@/components/layout/Header';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import { UserStats } from '@/components/menu/UserStats';
import { GameStatus } from '@/components/game/GameStatus';
import { ChessBoard } from '@/components/game/ChessBoard'; // Pastikan path ini benar

export default function ChessGameApp() {
  // ... (kode state sama seperti sebelumnya) ...
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [gameStatus, setGameStatus] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [progress, setProgress] = useState({ highestLevel: 1, gamesWon: 0, gamesPlayed: 0 });
  
  const engine = new ChessEngine();

  // ... (useEffect Auth & fetchProgress sama seperti sebelumnya) ...
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || 'Player');
        // Panggil fungsi load progress DB disini nanti
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            setIsLoggedIn(true);
            setUserName(session.user.user_metadata.full_name || 'Player');
        } else {
            setIsLoggedIn(false);
            setUserName('');
            setShowMenu(true);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
  };

  // ... (fungsi startGame, resetGame, makeAIMove sama) ...
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
          setGameStatus('Skakmat! Permainan Selesai.');
          // Logika save progress ada disini
      } else if (chess.isDraw()) {
          setGameStatus('Remis!');
      } else if (chess.isCheck()) {
          setGameStatus('Skak!');
      } else {
          setGameStatus('');
      }
  };

  // BAGIAN YANG ERROR SEBELUMNYA KITA PERBAIKI DISINI
  const handleSquareClick = (row: number, col: number) => {
    if (isThinking || gameStatus.includes('Selesai') || gameStatus.includes('Remis')) return;
    
    const isPlayerTurn = (game.turn() === 'w' && playerColor === 'white') || 
                         (game.turn() === 'b' && playerColor === 'black');
    
    if (!isPlayerTurn) return;

    // FIX: Tambahkan 'as Square' agar TypeScript tidak menganggap ini string biasa
    const square = getSquareNotation(row, col) as Square; 
    const piece = board[row][col];

    if (selectedSquare) {
      try {
        // FIX: selectedSquare juga harus dianggap Square
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
          // Klik invalid, cek apakah user klik bidak sendiri lagi
          if (piece && piece.color === game.turn()) {
             setSelectedSquare(square);
             setValidMoves(game.moves({ square, verbose: true }));
          } else {
             setSelectedSquare(null);
             setValidMoves([]);
          }
        }
      } catch (e) {
          // Fallback
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

  if (showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <Header userName={userName} highestLevel={progress.highestLevel} onLogout={handleLogout} showBack={false} />
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
      <Header userName={userName} highestLevel={progress.highestLevel} onLogout={handleLogout} onBack={() => setShowMenu(true)} showBack={true} />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-3">
            <GameStatus status={gameStatus} isThinking={isThinking} currentTurn={game.turn()} />
            <button onClick={resetGame} className="w-full bg-orange-500 text-white py-2 rounded mt-2">Reset Game</button>
        </div>
        {/* Pastikan props sesuai dengan komponen ChessBoard */}
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